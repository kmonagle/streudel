#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const IOS_DIR = path.join(__dirname, '..', 'ios');
const PROJECT_NAME = 'LifeOrdered';
const PBXPROJ_PATH = path.join(IOS_DIR, `${PROJECT_NAME}.xcodeproj`, 'project.pbxproj');

console.log('📝 Adding Share Extension target to Xcode project...');

if (!fs.existsSync(PBXPROJ_PATH)) {
  console.error('❌ Xcode project not found. Run `npx expo prebuild -p ios` first.');
  process.exit(1);
}

// For now, we need to open Xcode manually
console.log('⚠️  Manual step required:');
console.log('');
console.log('1. Open Xcode:');
console.log(`   cd ${IOS_DIR}`);
console.log(`   open ${PROJECT_NAME}.xcodeproj`);
console.log('');
console.log('2. In Xcode:');
console.log('   - Click on the project in the navigator');
console.log('   - Click the "+" button under "Targets"');
console.log('   - Select "Share Extension" template');
console.log('   - Name: ShareExtension');
console.log('   - Language: Swift');
console.log('   - Bundle ID: com.lifeordered.mobile.ShareExtension');
console.log('   - Click "Finish"');
console.log('');
console.log('3. Replace the generated files:');
console.log('   - Delete the auto-generated ShareExtension folder');
console.log('   - In Xcode, right-click the project > Add Files');
console.log(`   - Select: ${path.join(IOS_DIR, 'ShareExtension')}`);
console.log('   - Make sure "Add to targets: ShareExtension" is checked');
console.log('');
console.log('4. Build Settings:');
console.log('   - Select ShareExtension target');
console.log('   - Build Settings > Deployment Info > iOS Deployment Target: 13.4');
console.log('');
console.log('5. Save and commit the ios/ folder');
console.log('');
console.log('Then rebuild with: eas build --profile development --platform ios');
