import glob
import plistlib
import os

def prepare_project():
    print("Preparing Xcode project configurations...")
    
    # 1. Add LSApplicationCategoryType to Info.plists of the main app targets
    plists = glob.glob('UID Link/**/Info.plist', recursive=True)
    for p in plists:
        try:
            with open(p, 'rb') as f:
                pl = plistlib.load(f)
            
            # Identify the main app (not the extension, which has NSExtension)
            if 'NSExtension' not in pl:
                pl['LSApplicationCategoryType'] = 'public.app-category.utilities'
                with open(p, 'wb') as f:
                    plistlib.dump(pl, f)
                print(f"Added LSApplicationCategoryType to {p}")
        except Exception as e:
            print(f"Error modifying {p}: {e}")
            
    # 2. Force App Sandbox and Client Network access in all entitlements files
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
