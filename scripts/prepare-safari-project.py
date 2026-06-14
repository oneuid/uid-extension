import glob
import plistlib
import os
import re

def fix_bundle_identifiers():
    print("Replacing bundle identifiers (one.uid.UID-Link -> one.uid.link)...")
    if not os.path.exists('UID Link'):
        print("Warning: 'UID Link' directory not found. Skipping bundle ID replacement.")
        return
        
    for root, dirs, files in os.walk('UID Link'):
        for file in files:
            file_path = os.path.join(root, file)
            # Process files that can contain bundle identifier strings
            if file.endswith(('.swift', '.pbxproj', '.plist', '.storyboard', '.entitlements', '.h', '.m', '.json', '.xcconfig')):
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    if 'one.uid.UID-Link' in content:
                        new_content = content.replace('one.uid.UID-Link', 'one.uid.link')
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Successfully replaced bundle ID in {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path} for bundle ID: {e}")

def prepare_project():
    print("Preparing Xcode project configurations...")
    
    # 1. Fix all bundle identifiers first
    fix_bundle_identifiers()
    
    # 2. Update CURRENT_PROJECT_VERSION (Build Number) in project.pbxproj
    build_number = os.environ.get('BUILD_NUMBER', '1')
    project_file = 'UID Link/UID Link.xcodeproj/project.pbxproj'
    if os.path.exists(project_file):
        try:
            with open(project_file, 'r') as f:
                content = f.read()
            
            # Replace CURRENT_PROJECT_VERSION = <anything>; with CURRENT_PROJECT_VERSION = <build_number>;
            new_content = re.sub(
                r'CURRENT_PROJECT_VERSION = [^;]+;', 
                f'CURRENT_PROJECT_VERSION = {build_number};', 
                content
            )
            
            with open(project_file, 'w') as f:
                f.write(new_content)
            print(f"Successfully updated CURRENT_PROJECT_VERSION to {build_number}")
        except Exception as e:
            print(f"Error updating project build number: {e}")
    else:
        print(f"Warning: project.pbxproj not found at {project_file}")

    # 3. Add LSApplicationCategoryType and ITSAppUsesNonExemptEncryption to Info.plists
    plists = glob.glob('UID Link/**/Info.plist', recursive=True)
    for p in plists:
        try:
            with open(p, 'rb') as f:
                pl = plistlib.load(f)
            
            # Add Export Compliance bypass key to all targets
            pl['ITSAppUsesNonExemptEncryption'] = False
            
            # Identify the main app (not the extension, which has NSExtension)
            if 'NSExtension' not in pl:
                pl['LSApplicationCategoryType'] = 'public.app-category.utilities'
                
            with open(p, 'wb') as f:
                plistlib.dump(pl, f)
            print(f"Configured Info.plist at {p}")
        except Exception as e:
            print(f"Error modifying {p}: {e}")
            
    # 4. Force App Sandbox and Client Network access in all entitlements files
    entitlements = glob.glob('UID Link/**/*.entitlements', recursive=True)
    for e in entitlements:
        try:
            with open(e, 'rb') as f:
                ent = plistlib.load(f)
            
            ent['com.apple.security.app-sandbox'] = True
            ent['com.apple.security.network.client'] = True
            
            with open(e, 'wb') as f:
                plistlib.dump(ent, f)
            print(f"Enforced Sandbox & Network Client in {e}")
        except Exception as e:
            print(f"Error modifying {e}: {e}")

if __name__ == '__main__':
    prepare_project()
