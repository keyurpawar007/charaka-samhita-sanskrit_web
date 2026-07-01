import os

base_dir = "d:/advait aai"
dirs = ["2nd", "3rd", "4th", "5th", "9th", "10th", "11th lesson", "12th", "13th", "14th", "15th"]

for d in dirs:
    dpath = os.path.join(base_dir, d)
    if os.path.exists(dpath):
        files = sorted([f for f in os.listdir(dpath) if f.endswith('.ogg')])
        print(f"\n================ {d} (First 5 and Last 5 files) ================")
        print("First 5:")
        for f in files[:5]:
            print(f"  {f}")
        print("Last 5:")
        for f in files[-5:]:
            print(f"  {f}")
    else:
        print(f"Directory {d} does not exist!")
