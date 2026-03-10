import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import crypto from "crypto";
import cookieSignature from "cookie-signature";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials not found. Authentication will not work.");
}

// In-memory store for short-lived mobile transfer tokens (60 second TTL, one-time use)
interface TransferToken {
  sessionId: string;
  userId: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  expiresAt: number;
  used: boolean;
}
const mobileTransferTokens = new Map<string, TransferToken>();

// Clean up expired tokens periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of mobileTransferTokens.entries()) {
    if (data.expiresAt < now || data.used) {
      mobileTransferTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Generate a secure transfer token for mobile OAuth
function generateTransferToken(sessionId: string, userId: string, googleAccessToken?: string, googleRefreshToken?: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  mobileTransferTokens.set(token, {
    sessionId,
    userId,
    googleAccessToken,
    googleRefreshToken,
    expiresAt: Date.now() + 60 * 1000, // 60 second expiry
    used: false
  });
  return token;
}

// Validate and consume a transfer token (one-time use)
function consumeTransferToken(token: string): TransferToken | null {
  const data = mobileTransferTokens.get(token);
  if (!data) return null;
  if (data.used || data.expiresAt < Date.now()) {
    mobileTransferTokens.delete(token);
    return null;
  }
  data.used = true;
  mobileTransferTokens.delete(token);
  return data;
}

// Whitelist of allowed redirect URI patterns for mobile apps
const ALLOWED_MOBILE_REDIRECTS = [
  /^exp:\/\/.*/,           // Expo development
  /^streudel:\/\/.*/,           // Custom app scheme
  /^com\.streudel.*:\/\/.*/,    // Android deep links
];

// Validate if a redirect URI is allowed (prevents open redirect attacks)
function isAllowedRedirectUri(uri: string): boolean {
  if (!uri) return false;
  
  // Reject protocol-relative URLs (//evil.com) - security vulnerability
  if (uri.startsWith('//')) return false;
  
  // Allow only absolute paths starting with / (not //)
  if (uri.startsWith('/') && !uri.startsWith('//')) return true;
  
  // Check against mobile redirect patterns
  return ALLOWED_MOBILE_REDIRECTS.some(pattern => pattern.test(uri));
}

// Build mobile redirect URL safely, preserving existing query strings
function buildMobileRedirectUrl(baseUri: string, params: Record<string, string>): string {
  try {
    const url = new URL(baseUri);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    // If URL parsing fails, fallback to simple concatenation with safety checks
    const separator = baseUri.includes('?') ? '&' : '?';
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `${baseUri}${separator}${queryString}`;
  }
}

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true,
    saveUninitialized: false,
    rolling: true, // Reset 30-day expiry on every request
    name: 'connect.sid', // Explicit session cookie name
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax", // "none" required for cross-origin mobile requests
      maxAge: sessionTtl,
      path: '/',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Middleware to convert Authorization header to Cookie for mobile apps
  // Mobile apps send: Authorization: Bearer s:sessionId.signature
  // This converts it to a cookie so express-session can process it
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionId = authHeader.slice(7); // Remove 'Bearer ' prefix
      // Only set cookie if not already present
      if (!req.headers.cookie || !req.headers.cookie.includes('connect.sid')) {
        req.headers.cookie = `connect.sid=${encodeURIComponent(sessionId)}`;
        console.log("📱 Converted Authorization header to cookie for session:", sessionId.substring(0, 20) + "...");
      }
    }
    next();
  });
  
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only set up Google OAuth if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Google OAuth Strategy with dynamic callback URL
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Google OAuth profile received:", {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: `${profile.name?.givenName} ${profile.name?.familyName}`
      });
      
      // Upsert user in database
      const dbUser = await storage.upsertUser({
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        firstName: profile.name?.givenName || "",
        lastName: profile.name?.familyName || "",
        profileImageUrl: profile.photos?.[0]?.value || "",
      });

      console.log("User upserted successfully:", dbUser.id);

      // Store tokens with user object for calendar access
      const userWithTokens = {
        ...dbUser,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
      };

      return done(null, userWithTokens);
    } catch (error) {
      console.error("Google OAuth strategy error:", error);
      return done(error, false);
    }
    }));

    passport.serializeUser((user: any, done) => {
      // Store user ID and tokens in session
      done(null, {
        id: user.id,
        googleAccessToken: user.googleAccessToken,
        googleRefreshToken: user.googleRefreshToken,
      });
    });

    passport.deserializeUser(async (sessionData: any, done) => {
      try {
        const userId = typeof sessionData === 'string' ? sessionData : sessionData.id;
        const user = await storage.getUser(userId);
        if (!user) {
          // User not found, clear the session
          return done(null, false);
        }
        // Attach tokens from session to user object
        const userWithTokens = {
          ...user,
          googleAccessToken: sessionData.googleAccessToken,
          googleRefreshToken: sessionData.googleRefreshToken,
        };
        done(null, userWithTokens);
      } catch (error) {
        // Handle deserialization errors gracefully
        console.error("Deserialization error:", error);
        done(null, false);
      }
    });

    // Auth routes with better error handling
    app.get("/api/auth/google", (req, res, next) => {
      console.log("📱 Initiating Google OAuth for domain:", req.hostname);
      console.log("📱 Query params:", JSON.stringify(req.query));
      
      // Check for state (mobile app may pass it directly) or redirect_uri
      let state: string | undefined;
      const existingState = req.query.state as string;
      const redirectUri = req.query.redirect_uri as string;
      
      if (existingState) {
        // Mobile app passed state directly - validate and use it
        console.log("📱 State received from mobile:", existingState);
        try {
          const stateData = JSON.parse(existingState);
          if (stateData.mobileRedirectUri && isAllowedRedirectUri(stateData.mobileRedirectUri)) {
            state = existingState;
            // Also store in session as backup (passport may not preserve state)
            (req.session as any).mobileRedirectUri = stateData.mobileRedirectUri;
            console.log("📱 Using mobile state + stored in session:", state);
          } else {
            console.log("📱 Mobile redirect URI not allowed:", stateData.mobileRedirectUri);
          }
        } catch (e) {
          console.log("📱 Invalid state JSON:", e);
        }
      } else if (redirectUri) {
        // Legacy: redirect_uri passed separately
        console.log("📱 redirect_uri received:", redirectUri);
        if (isAllowedRedirectUri(redirectUri)) {
          state = JSON.stringify({ platform: 'mobile', mobileRedirectUri: redirectUri });
          (req.session as any).mobileRedirectUri = redirectUri;
          console.log("📱 Built state + stored in session:", state);
        } else {
          console.log("📱 redirect_uri NOT allowed:", redirectUri);
        }
      } else {
        console.log("📱 No mobile params (web login)");
      }
      
      // Force session save before redirecting
      req.session.save((err) => {
        if (err) console.error("📱 Session save error:", err);
        else console.log("📱 Session saved with mobileRedirectUri");
      });
      
      const authOptions: any = { 
        scope: ["profile", "email", "https://www.googleapis.com/auth/calendar.readonly"],
      };
      if (state) {
        authOptions.state = state;
      }
      // Force consent and offline access for refresh token
      authOptions.accessType = "offline";
      authOptions.prompt = "consent";
      
      console.log("📱 Auth options:", JSON.stringify(authOptions));
      passport.authenticate("google", authOptions)(req, res, next);
    });

    app.get("/api/auth/google/callback", (req, res, next) => {
      console.log("📱 Google callback received with code:", req.query.code ? "present" : "missing");
      console.log("📱 State from callback:", req.query.state);
      console.log("📱 Session ID in callback:", req.sessionID);
      console.log("📱 Session mobileRedirectUri:", (req.session as any).mobileRedirectUri);
      
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("📱 Google OAuth callback error:", err);
          return res.status(500).json({ error: "Authentication failed", details: err.message });
        }
        
        if (!user) {
          console.error("📱 Google OAuth callback - no user returned:", info);
          return res.status(401).json({ error: "Authentication failed", details: "No user returned" });
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("📱 Session login error:", loginErr);
            return res.status(500).json({ error: "Session creation failed", details: loginErr.message });
          }
          
          console.log("📱 Google OAuth callback successful for user:", user.id);
          
          // Try state parameter first, then fall back to session
          let mobileRedirectUri: string | undefined;
          
          const state = req.query.state as string;
          if (state) {
            try {
              const stateData = JSON.parse(state);
              console.log("📱 Parsed state data:", JSON.stringify(stateData));
              if (stateData.mobileRedirectUri) {
                mobileRedirectUri = stateData.mobileRedirectUri;
              }
            } catch (parseErr) {
              console.error("📱 Failed to parse state:", parseErr);
            }
          }
          
          // Fallback to session storage
          if (!mobileRedirectUri) {
            mobileRedirectUri = (req.session as any).mobileRedirectUri;
            if (mobileRedirectUri) {
              console.log("📱 Using mobileRedirectUri from session:", mobileRedirectUri);
            }
          }
          
          // Explicitly save session before redirecting to ensure it's persisted
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("📱 Session save error:", saveErr);
            }
            
            if (mobileRedirectUri && isAllowedRedirectUri(mobileRedirectUri)) {
              // Clear from session
              delete (req.session as any).mobileRedirectUri;
              // Generate a one-time transfer token (60 second TTL) - include Google tokens for calendar access
              const transferToken = generateTransferToken(req.sessionID, user.id, user.googleAccessToken, user.googleRefreshToken);
              // Redirect to mobile app with transfer token
              const redirectUrl = buildMobileRedirectUrl(mobileRedirectUri, {
                auth: 'success',
                transferToken: transferToken
              });
              console.log("📱 Redirecting to mobile app:", redirectUrl);
              return res.redirect(redirectUrl);
            }
            
            console.log("📱 No mobile redirect, going to web /");
            res.redirect("/");
          });
        });
      })(req, res, next);
    });

    app.get("/api/auth/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.redirect("/");
      });
    });
  } else {
    // Fallback serialization for development/testing
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });

    // Development auth routes when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(500).json({ error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." });
    });

    app.get("/api/auth/logout", (req, res) => {
      res.redirect("/");
    });
  }

  // Add development bypass for testing when OAuth fails
  app.get("/api/auth/dev-login", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ error: "Not found" });
    }
    
    try {
      // Create a test user for development
      const testUser = await storage.upsertUser({
        id: "dev-user-123",
        email: "developer@example.com",
        firstName: "Dev",
        lastName: "User",
        profileImageUrl: "",
      });

      req.logIn(testUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Development login failed" });
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("Development login error:", error);
      res.status(500).json({ error: "Development login failed" });
    }
  });

  // Add legacy routes for compatibility
  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/api/auth/logout");
  });

  // Mobile token exchange endpoint - exchanges transfer token for session cookie
  app.post("/api/auth/mobile/exchange", async (req, res) => {
    const { transferToken } = req.body;
    
    if (!transferToken || typeof transferToken !== 'string') {
      return res.status(400).json({ error: "Missing or invalid transferToken" });
    }
    
    const tokenData = consumeTransferToken(transferToken);
    if (!tokenData) {
      return res.status(401).json({ error: "Invalid or expired transfer token" });
    }
    
    // Get the user from storage
    const user = await storage.getUser(tokenData.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    // Attach Google tokens from transfer token for calendar access
    const userWithTokens = {
      ...user,
      googleAccessToken: tokenData.googleAccessToken,
      googleRefreshToken: tokenData.googleRefreshToken,
    };
    
    // Log the user in to create a new session (with tokens attached)
    req.logIn(userWithTokens, (err) => {
      if (err) {
        console.error("Mobile exchange login error:", err);
        return res.status(500).json({ error: "Failed to create session" });
      }
      
      // Explicitly save session to database before responding
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("📱 Mobile exchange session save error:", saveErr);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        // Sign the session ID using cookie-signature (exactly how express-session does it)
        // Format: s:sessionId.signature
        const sessionSecret = process.env.SESSION_SECRET!;
        const signedValue = cookieSignature.sign(req.sessionID, sessionSecret);
        const signedSessionId = 's:' + signedValue;
        
        console.log("📱 Mobile exchange successful:");
        console.log("📱   Raw sessionID:", req.sessionID);
        console.log("📱   Signed value:", signedValue);
        console.log("📱   Full signed sessionId:", signedSessionId);
        console.log("📱   Expected format: s:sessionId.signature");
        
        // Return user info and signed session ID for mobile storage
        // The session cookie is also set via Set-Cookie header
        res.json({
          success: true,
          sessionId: signedSessionId,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl
          }
        });
      });
    });
  });

  // Mobile-friendly auth status endpoint (returns JSON)
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      return res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }
      });
    }
    res.json({ authenticated: false, user: null });
  });

  // Debug endpoint to check OAuth configuration
  app.get("/api/auth/debug", (req, res) => {
    const fullDomain = req.get('host') || req.hostname;
    res.json({
      hasGoogleCredentials: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
      clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
      hostname: req.hostname,
      host: req.get('host'),
      protocol: req.protocol,
      fullUrl: `${req.protocol}://${fullDomain}`,
      callbackUrl: `${req.protocol}://${fullDomain}/api/auth/google/callback`,
      headers: {
        'x-forwarded-proto': req.get('x-forwarded-proto'),
        'x-forwarded-host': req.get('x-forwarded-host'),
        'host': req.get('host')
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // If Google OAuth is not configured, allow all requests for development
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // Create a mock user for development
    req.user = { id: "dev-user" };
    return next();
  }

  // Check for dev bypass header (for mobile testing)
  const bypassSecret = process.env.DEV_BYPASS_SECRET;
  const bypassHeader = req.get('X-Dev-Bypass');
  if (bypassSecret && bypassHeader === bypassSecret) {
    // Use kdmonagle@gmail.com user for bypass
    const bypassUser = await storage.getUserByEmail("kdmonagle@gmail.com");
    if (bypassUser) {
      req.user = bypassUser;
      return next();
    }
  }

  // Debug logging for auth issues
  if (req.path.includes('recipe-queue')) {
    console.log("🔐 Auth check for recipe-queue:", {
      path: req.path,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      hasSession: !!req.session,
      sessionID: req.sessionID?.substring(0, 10),
      cookieHeader: req.headers.cookie?.substring(0, 50),
      authHeader: req.headers.authorization?.substring(0, 30),
    });
  }

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};