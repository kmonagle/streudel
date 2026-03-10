const { withDangerousMod, withPlugins, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SHARE_EXTENSION_NAME = 'ShareExtension';
const SHARE_EXTENSION_BUNDLE_ID = 'com.lifeordered.mobile.ShareExtension';
const APP_GROUP_ID = 'group.com.lifeordered.mobile';

/**
 * Copy Share Extension files to iOS project
 */
function copyShareExtensionFiles(iosProjectPath, projectRoot) {
  const shareExtensionSource = path.join(projectRoot, 'ios', SHARE_EXTENSION_NAME);
  const shareExtensionDest = path.join(iosProjectPath, SHARE_EXTENSION_NAME);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(shareExtensionDest)) {
    fs.mkdirSync(shareExtensionDest, { recursive: true });
  }

  // Copy all files from source to destination
  if (fs.existsSync(shareExtensionSource)) {
    const files = fs.readdirSync(shareExtensionSource);
    files.forEach((file) => {
      const srcFile = path.join(shareExtensionSource, file);
      const destFile = path.join(shareExtensionDest, file);

      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`  ✓ Copied ${file}`);
      }
    });
  } else {
    console.warn(`⚠️  Share Extension source not found at: ${shareExtensionSource}`);
  }
}

/**
 * Add Share Extension target to Podfile
 */
function modifyPodfile(iosPath) {
  const podfilePath = path.join(iosPath, 'Podfile');

  if (!fs.existsSync(podfilePath)) {
    console.warn('⚠️  Podfile not found');
    return;
  }

  let podfileContent = fs.readFileSync(podfilePath, 'utf8');

  // Check if Share Extension target already exists
  if (podfileContent.includes(`target '${SHARE_EXTENSION_NAME}'`)) {
    console.log('  ℹ️  Share Extension already in Podfile');
    return;
  }

  // Add Share Extension target before the end
  const shareExtensionPodfile = `
  # Share Extension target
  target '${SHARE_EXTENSION_NAME}' do
    inherit! :complete
    pod 'ExpoModulesCore'
  end
`;

  // Insert before the final 'end'
  const lines = podfileContent.split('\n');
  const lastEndIndex = lines.lastIndexOf('end');

  if (lastEndIndex !== -1) {
    lines.splice(lastEndIndex, 0, shareExtensionPodfile);
    podfileContent = lines.join('\n');

    fs.writeFileSync(podfilePath, podfileContent);
    console.log('  ✓ Added Share Extension to Podfile');
  }
}

/**
 * Main plugin
 */
const withShareExtension = (config) => {
  // Update app.json entitlements
  config = withPlugins(config, [
    // Add app groups entitlement
    (config) => {
      if (!config.ios) {
        config.ios = {};
      }
      if (!config.ios.entitlements) {
        config.ios.entitlements = {};
      }
      config.ios.entitlements['com.apple.security.application-groups'] = [APP_GROUP_ID];
      return config;
    },
  ]);

  // Modify iOS files during prebuild
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, 'ios');
      const projectName = config.ios?.bundleIdentifier?.split('.').pop() || 'lifeorderedmobile';

      console.log('🔧 Setting up iOS Share Extension...');

      try {
        // Copy Share Extension files
        copyShareExtensionFiles(iosPath, projectRoot);

        // Modify Podfile
        modifyPodfile(iosPath);

        console.log('✅ Share Extension setup complete');
        console.log('⚠️  NOTE: You must manually add the Share Extension target in Xcode');
        console.log('    or use EAS Build which will handle this automatically');
      } catch (error) {
        console.error('❌ Error setting up Share Extension:', error);
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withShareExtension;
