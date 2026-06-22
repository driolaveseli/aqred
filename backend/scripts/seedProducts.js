/**
 * Seed 1000 realistic products into mis_db, linked to Aqred.
 * Run: node backend/scripts/seedProducts.js
 * Safe to re-run — skips duplicates via ON CONFLICT on sku.
 */

const { Pool } = require("pg");

const pool = new Pool({
  user:     "postgres",
  host:     "localhost",
  database: "mis_db",
  password: "REDACTED_ROTATED_CREDENTIAL",
  port:     5432,
});

// ── Product catalogue data ────────────────────────────────────────────────────

const CATALOGUE = {
  Electronics: [
    ["4K Smart TV", 'Ultra HD 55" Smart TV with HDR and built-in streaming apps', [699, 1299], [5, 40]],
    ["OLED Monitor", "27-inch OLED gaming monitor with 144Hz refresh rate", [499, 899], [5, 30]],
    ["Curved Gaming Monitor", "34-inch curved ultrawide 165Hz monitor", [599, 999], [5, 25]],
    ["Portable Projector", "Mini HD projector with built-in speakers and WiFi", [299, 599], [5, 30]],
    ["Soundbar", "5.1 surround soundbar with Dolby Atmos support", [199, 499], [5, 40]],
    ["Wireless Earbuds", "Active noise-cancelling true wireless earbuds", [79, 249], [10, 80]],
    ["Over-Ear Headphones", "Premium studio-quality over-ear headphones", [149, 399], [10, 60]],
    ["Smart Speaker", "Voice-assistant smart speaker with 360° sound", [49, 199], [20, 100]],
    ["Bluetooth Speaker", "Waterproof portable Bluetooth speaker", [39, 149], [20, 100]],
    ["Action Camera", "4K action camera with image stabilization", [199, 499], [5, 40]],
    ["Digital Camera", "24MP mirrorless digital camera with 4K video", [699, 1499], [3, 20]],
    ["Camera Lens", "50mm f/1.8 prime lens for mirrorless cameras", [199, 499], [5, 30]],
    ["Drone", "Foldable drone with 4K camera and 30-min flight time", [499, 1199], [3, 20]],
    ["Smart Watch", "Health-monitoring smartwatch with GPS and LTE", [199, 499], [10, 60]],
    ["Fitness Tracker", "24/7 fitness and sleep tracking band", [49, 149], [20, 100]],
    ["E-Reader", "6-inch e-ink e-reader with adjustable warm light", [99, 199], [10, 60]],
    ["Tablet 10-inch", "10-inch Android tablet with 128GB storage", [199, 499], [5, 40]],
    ["Tablet 12-inch", "12.9-inch tablet with OLED display and stylus", [699, 1199], [3, 25]],
    ["Robot Vacuum", "Self-emptying robot vacuum with LiDAR mapping", [299, 799], [3, 20]],
    ["Air Purifier", "HEPA air purifier for rooms up to 500 sq ft", [99, 299], [5, 40]],
    ["Smart Thermostat", "Wi-Fi smart thermostat with energy reports", [99, 249], [10, 50]],
    ["Video Doorbell", "1080p video doorbell with two-way audio", [99, 249], [5, 50]],
    ["Security Camera", "Outdoor 4K PoE security camera with night vision", [79, 199], [10, 60]],
    ["NVR System", "8-channel 4K NVR with 2TB HDD pre-installed", [299, 599], [3, 20]],
    ["Smart Plug", "Wi-Fi smart plug with energy monitoring", [15, 39], [50, 200]],
    ["Smart Light Bulb", "Colour-changing smart bulb, E27, 1000lm", [12, 29], [50, 200]],
    ["Gaming Console", "Next-gen gaming console with 1TB SSD", [399, 599], [5, 30]],
    ["Handheld Gaming", "Portable handheld gaming device with 7-inch display", [199, 399], [5, 40]],
    ["VR Headset", "Standalone VR headset with 4K display per eye", [299, 699], [3, 20]],
    ["Electric Toothbrush", "Sonic electric toothbrush with pressure sensor", [39, 99], [20, 80]],
  ],
  "Computer Accessories": [
    ["Mechanical Keyboard", "Full-size mechanical keyboard with RGB backlight", [79, 199], [10, 80]],
    ["Wireless Keyboard", "Slim wireless keyboard with multi-device support", [49, 129], [15, 80]],
    ["Ergonomic Mouse", "Vertical ergonomic wireless mouse", [39, 99], [15, 80]],
    ["Gaming Mouse", "High-precision gaming mouse with 25K DPI sensor", [49, 129], [15, 80]],
    ["Mouse Pad XL", "Extended gaming mouse pad, 900×400mm", [19, 49], [30, 120]],
    ["USB-C Hub", "11-in-1 USB-C hub with 4K HDMI and 100W PD", [39, 99], [20, 100]],
    ["Thunderbolt Dock", "Thunderbolt 4 dock with dual 4K display output", [149, 349], [5, 40]],
    ["External SSD", "1TB USB-C portable SSD, 1050 MB/s read speed", [79, 199], [10, 60]],
    ["External HDD", "5TB external hard drive, USB 3.0", [89, 149], [10, 60]],
    ["NVMe SSD M.2", "2TB NVMe PCIe 4.0 M.2 internal SSD", [99, 249], [10, 60]],
    ["RAM DDR5 32GB", "32GB DDR5 5600MHz desktop memory kit", [89, 199], [10, 60]],
    ["RAM DDR5 64GB", "64GB DDR5 5600MHz desktop memory kit", [169, 349], [5, 40]],
    ["Graphics Card RTX", "High-performance gaming GPU with 16GB GDDR6X", [599, 999], [3, 20]],
    ["CPU Cooler", "360mm AIO liquid cooler with ARGB fans", [79, 199], [5, 40]],
    ["Webcam 4K", "4K USB webcam with auto-focus and ring light", [79, 179], [10, 60]],
    ["Capture Card", "4K HDMI capture card for live streaming", [99, 199], [5, 40]],
    ["KVM Switch", "4-port HDMI KVM switch with USB hub", [49, 129], [5, 40]],
    ["Cable Management Kit", "Desk cable management kit with tray and clips", [19, 49], [30, 120]],
    ["Monitor Arm", "Dual monitor arm with full articulation", [49, 129], [10, 60]],
    ["Laptop Stand", "Adjustable aluminium laptop stand", [29, 79], [20, 80]],
    ["Wrist Rest", "Memory foam keyboard and mouse wrist rest set", [19, 49], [30, 120]],
    ["Headset Stand", "USB headset stand with 3-port USB hub", [19, 49], [20, 80]],
    ["USB 3.0 Hub", "7-port powered USB 3.0 hub", [29, 59], [20, 100]],
    ["HDMI Cable 2.1", "8K HDMI 2.1 cable, 2m", [12, 29], [50, 200]],
    ["DisplayPort Cable", "8K DisplayPort 1.4 cable, 2m", [12, 29], [50, 200]],
    ["USB-C Cable 240W", "USB-C to USB-C 240W fast-charge cable, 2m", [12, 29], [50, 200]],
    ["GPU Riser Cable", "PCIe 4.0 GPU riser cable for vertical mount", [29, 69], [10, 50]],
    ["ATX Power Supply", "850W 80 Plus Gold fully modular PSU", [99, 199], [5, 40]],
    ["PC Case Mid-Tower", "Tempered glass mid-tower ATX case with airflow", [79, 179], [5, 30]],
    ["SFX Power Supply", "750W SFX-L 80 Plus Platinum modular PSU", [99, 199], [5, 30]],
  ],
  Hardware: [
    ["Power Drill Kit", "20V cordless drill with 2 batteries and bit set", [59, 149], [5, 40]],
    ["Impact Driver", "20V brushless cordless impact driver", [69, 149], [5, 40]],
    ["Circular Saw", "7-1/4-inch 15A corded circular saw", [79, 169], [3, 25]],
    ["Jigsaw", "Variable-speed corded jigsaw with laser guide", [49, 119], [5, 30]],
    ["Random Orbit Sander", "5-inch 3A random orbit sander", [39, 89], [5, 30]],
    ["Bench Grinder", "8-inch bench grinder with adjustable tool rest", [59, 139], [3, 20]],
    ["Rotary Tool Kit", "Variable-speed rotary tool with 200 accessories", [39, 99], [5, 40]],
    ["Heat Gun", "Dual-temperature heat gun with accessories", [29, 69], [10, 50]],
    ["Soldering Iron Kit", "60W adjustable temperature soldering station", [29, 79], [10, 50]],
    ["Multimeter", "True RMS auto-ranging digital multimeter", [39, 99], [10, 60]],
    ["Oscilloscope", "4-channel 100MHz digital storage oscilloscope", [299, 699], [2, 15]],
    ["Label Maker", "Industrial thermal label maker with QWERTY keyboard", [49, 129], [5, 40]],
    ["Cable Tester", "Network and coax cable tester with display", [19, 49], [10, 50]],
    ["Crimping Tool Kit", "RJ45/RJ11 crimp, cut, strip tool with connectors", [15, 39], [20, 80]],
    ["Cable Stripper", "Automatic cable stripping and wire-cutting tool", [12, 29], [20, 80]],
    ["Laser Level", "Self-levelling 360° cross-line laser level", [49, 139], [5, 40]],
    ["Digital Caliper", "6-inch digital vernier caliper, stainless steel", [15, 49], [20, 80]],
    ["Torque Wrench", '3/8" drive click-type torque wrench, 10–80 Nm', [29, 79], [10, 50]],
    ["Socket Set", "108-piece 1/4 and 3/8-inch drive socket set", [49, 129], [5, 40]],
    ["Hex Key Set", "25-piece ball-end hex key set, metric and imperial", [12, 29], [30, 120]],
    ["Screwdriver Set", "56-piece precision screwdriver and bit set", [19, 49], [30, 120]],
    ["Pliers Set", "7-piece professional pliers set", [29, 79], [15, 60]],
    ["Wire Stripper", "Self-adjusting wire stripper, 10–24 AWG", [12, 29], [20, 80]],
    ["Electrical Tape", "Pack of 10 vinyl electrical tape rolls", [9, 19], [50, 200]],
    ["Duct Tape Heavy", "Industrial grade aluminium foil duct tape", [9, 19], [50, 200]],
    ["Cable Ties Pack", "500-piece reusable nylon cable tie assortment", [9, 19], [50, 200]],
    ["Anchor Kit", "200-piece wall anchor and screw assortment", [9, 19], [50, 200]],
    ["Safety Glasses", "ANSI Z87.1 anti-fog safety glasses", [9, 19], [30, 120]],
    ["Work Gloves", "Cut-resistant mechanic work gloves, size L", [12, 29], [30, 120]],
    ["Knee Pads", "Professional gel knee pad set with straps", [19, 49], [15, 60]],
  ],
  Accessories: [
    ["Phone Case", "Rugged drop-proof phone case, various models", [9, 29], [50, 200]],
    ["Screen Protector", "Tempered glass screen protector, 3-pack", [9, 19], [50, 200]],
    ["Car Phone Mount", "Wireless charging dashboard phone mount", [19, 49], [30, 120]],
    ["Portable Charger 20K", "20000mAh power bank with 65W USB-C PD", [39, 89], [20, 100]],
    ["Portable Charger 10K", "10000mAh slim power bank, 22.5W fast charge", [19, 49], [30, 120]],
    ["GaN Charger 65W", "65W 3-port GaN wall charger (2× USB-C, 1× USB-A)", [29, 59], [30, 120]],
    ["GaN Charger 140W", "140W 4-port GaN desktop charger", [49, 99], [15, 80]],
    ["Wireless Charger", "15W dual wireless charging pad", [19, 49], [30, 120]],
    ["MagSafe Stand", "MagSafe magnetic charging stand with adjustable angle", [29, 59], [20, 80]],
    ["Lightning Cable", "1m MFi certified Lightning to USB-C cable", [12, 29], [50, 200]],
    ["USB-A to C Cable", "1m USB-A to USB-C 3A fast charge cable", [9, 19], [50, 200]],
    ["Micro-USB Cable", "1m Micro-USB charging and data cable, 3-pack", [9, 19], [50, 200]],
    ["Travel Adapter", "Universal travel power adapter with USB ports", [19, 49], [30, 120]],
    ["Surge Protector", "6-outlet surge protector with 2 USB-A ports", [19, 49], [30, 120]],
    ["Extension Lead", "5m 4-outlet extension lead with surge protection", [15, 39], [30, 120]],
    ["Phone Stand", "Foldable aluminium phone and tablet stand", [9, 29], [50, 200]],
    ["Ring Light 10-inch", '10" LED ring light with phone holder and stand', [29, 69], [15, 80]],
    ["Ring Light 18-inch", '18" professional LED ring light with remote', [59, 129], [5, 40]],
    ["Camera Tripod", "Aluminium travel tripod with ball head", [29, 79], [10, 60]],
    ["Gimbal Stabiliser", "3-axis smartphone gimbal stabiliser", [79, 199], [5, 40]],
    ["Shoulder Bag", "Padded laptop shoulder bag, fits up to 15.6-inch", [29, 79], [20, 80]],
    ["Backpack 30L", "30L waterproof laptop backpack with USB port", [39, 99], [15, 80]],
    ["Hard Case", "Hard shell carry case for electronics", [19, 49], [20, 80]],
    ["Laptop Sleeve 13", "Neoprene sleeve for 13-inch laptops", [12, 29], [30, 120]],
    ["Laptop Sleeve 15", "Neoprene sleeve for 15.6-inch laptops", [12, 29], [30, 120]],
    ["Anti-Theft Backpack", "Anti-theft smart backpack with USB charging port", [49, 119], [10, 60]],
    ["Webcam Cover", "3-pack sliding webcam privacy cover", [5, 12], [100, 300]],
    ["Privacy Screen", "14-inch privacy screen filter for laptops", [19, 49], [15, 80]],
    ["RFID Wallet", "Slim carbon fibre RFID-blocking card wallet", [12, 29], [50, 200]],
    ["Desk Organiser", "Bamboo desk organiser with drawer", [19, 49], [20, 80]],
  ],
  "Office Equipment": [
    ["Laser Printer", "Monochrome laser printer, 40ppm, duplex, WiFi", [199, 399], [3, 20]],
    ["Color Laser Printer", "Colour laser printer, 35ppm, duplex, WiFi", [299, 599], [2, 15]],
    ["Inkjet Printer", "Wireless all-in-one inkjet printer and scanner", [99, 249], [5, 30]],
    ["Label Printer", "Thermal label printer, 203dpi, USB/WiFi", [79, 199], [5, 30]],
    ["Barcode Scanner", "2D wireless barcode scanner with stand", [79, 199], [5, 40]],
    ["Document Scanner", "ADF document scanner, 60ppm, duplex, WiFi", [199, 499], [3, 20]],
    ["Flatbed Scanner", "Flatbed film and document scanner, 4800dpi", [99, 249], [3, 20]],
    ["Office Shredder", "Cross-cut paper shredder, 12 sheets, 25L bin", [79, 199], [3, 20]],
    ["Laminator A4", "A4 thermal laminator, up to 125 micron pouches", [29, 79], [10, 50]],
    ["Binding Machine", "Comb binding machine, up to 450 sheets", [49, 129], [5, 30]],
    ["Whiteboard 90×120", "Magnetic dry-erase whiteboard with tray", [49, 129], [3, 20]],
    ["Whiteboard 120×180", "Large magnetic whiteboard with aluminium frame", [79, 199], [2, 15]],
    ["Flipchart Easel", "Adjustable flipchart easel with paper pad", [39, 99], [3, 20]],
    ["Projector Screen", "100-inch motorised projector screen", [199, 499], [2, 15]],
    ["HDMI Switcher", "8-port HDMI 2.0 switch with remote control", [39, 99], [5, 40]],
    ["Video Conferencing Kit", "HD webcam + speakerphone bundle for meetings", [199, 499], [3, 20]],
    ["Desktop Calculator", "12-digit desktop printing calculator", [19, 49], [20, 80]],
    ["Scientific Calculator", "Advanced scientific calculator, 552 functions", [15, 39], [20, 80]],
    ["Stapler Heavy-Duty", "Heavy-duty desktop stapler, 100 sheets", [19, 49], [20, 80]],
    ["Electric Stapler", "Electric heavy-duty stapler, 70 sheets", [29, 79], [10, 50]],
    ["Hole Punch 3-Ring", "Heavy-duty 3-hole punch, adjustable guide", [19, 49], [20, 80]],
    ["Paper Trimmer", "A3 guillotine paper trimmer, 12 sheets", [29, 79], [10, 50]],
    ["Filing Cabinet 4-Drawer", "4-drawer steel filing cabinet with lock", [149, 349], [2, 10]],
    ["Magazine File", "10-pack magazine file boxes, assorted colours", [19, 49], [20, 80]],
    ["Desk Drawer Unit", "3-drawer mobile pedestal with lock", [99, 249], [3, 15]],
    ["Monitor Privacy Filter", "27-inch 16:9 anti-spy privacy screen", [29, 79], [10, 50]],
    ["Fingerprint Reader", "USB fingerprint scanner for Windows Hello", [29, 69], [10, 50]],
    ["Digital Pen", "Active stylus compatible with touchscreens", [39, 99], [10, 50]],
    ["Sticky Note Set", "12-pack sticky note pads, 76×76mm, mixed colours", [9, 19], [50, 200]],
    ["Ballpoint Pen Box", "Box of 50 retractable ballpoint pens", [9, 19], [50, 200]],
  ],
  Furniture: [
    ["Sit-Stand Desk", "Electric sit-stand desk, 140×70cm, dual motor", [499, 999], [2, 10]],
    ["L-Shaped Desk", "L-shaped corner office desk with cable management", [199, 499], [2, 10]],
    ["Standing Desk Mat", "Anti-fatigue standing desk mat, 90×60cm", [39, 99], [10, 50]],
    ["Ergonomic Chair", "Mesh-back ergonomic office chair with lumbar support", [199, 599], [3, 15]],
    ["Gaming Chair", "Racing-style gaming chair with 4D armrests", [199, 499], [3, 15]],
    ["Executive Chair", "High-back leather executive office chair", [299, 799], [2, 10]],
    ["Kneeling Chair", "Ergonomic kneeling chair for posture improvement", [99, 249], [5, 20]],
    ["Saddle Chair", "Active saddle seat for adjustable workstations", [149, 349], [3, 15]],
    ["Footrest", "Adjustable ergonomic footrest with massage surface", [29, 79], [15, 60]],
    ["Under-Desk Treadmill", "Walking pad treadmill for under standing desk", [399, 799], [2, 10]],
    ["Desk Pad", "Large PU leather desk pad, 90×40cm", [19, 49], [20, 80]],
    ["Monitor Riser", "Bamboo monitor riser with storage shelf", [29, 79], [10, 50]],
    ["CPU Holder", "Adjustable under-desk CPU holder with wheels", [29, 69], [10, 50]],
    ["Coat Rack", "Freestanding coat and bag rack with umbrella stand", [49, 129], [5, 30]],
    ["Storage Cabinet", "2-door storage cabinet with 4 shelves", [99, 299], [2, 10]],
    ["Bookshelf 5-Tier", "5-tier open bookshelf, industrial style", [79, 199], [3, 15]],
    ["Stackable Drawer", "A4 5-tier stackable paper tray and drawer", [29, 79], [10, 50]],
    ["Partition Screen", "Freestanding acoustic office partition panel", [99, 299], [2, 10]],
    ["Reception Desk", "Modern L-shaped reception desk with storage", [499, 999], [1, 5]],
    ["Conference Table", "10-seat oval conference table with cable port", [699, 1499], [1, 5]],
    ["Folding Table", "Portable folding trestle table, 180×60cm", [49, 129], [3, 20]],
    ["Stacking Chair", "Lightweight polypropylene stacking chair", [29, 79], [10, 50]],
    ["Barstool", "Adjustable height counter barstool", [49, 129], [5, 30]],
    ["Whiteboard Easel", "Portable A1 magnetic whiteboard easel", [79, 199], [3, 15]],
    ["Locker Unit", "4-door steel locker unit with keys", [149, 399], [2, 10]],
    ["Pegboard Panel", "Steel pegboard panel with hooks and bins", [29, 79], [10, 50]],
    ["Magazine Rack", "Wall-mounted steel magazine display rack", [29, 79], [5, 30]],
    ["Rubbish Bin", "Sensor-operated stainless steel waste bin, 50L", [49, 129], [5, 30]],
    ["Recycling Bin Set", "3-compartment recycling bin station", [39, 99], [5, 30]],
    ["Floor Mat", "Anti-fatigue floor mat for hard surfaces, 120×90cm", [29, 79], [10, 50]],
  ],
  "Industrial Equipment": [
    ["Label Applicator", "Semi-automatic label applicator for bottles", [299, 699], [1, 10]],
    ["Barcode Printer", "Industrial thermal transfer barcode printer, 300dpi", [299, 799], [2, 15]],
    ["RFID Reader", "UHF RFID desktop reader with USB, 1m range", [199, 499], [2, 15]],
    ["Handheld Terminal", "Android rugged handheld barcode scanner terminal", [399, 899], [2, 10]],
    ["Weight Scale 300kg", "300kg platform floor scale with RS-232 output", [199, 499], [2, 10]],
    ["Weight Scale 60kg", "60kg precision bench scale, 1g resolution", [79, 199], [3, 15]],
    ["Counting Scale", "Parts counting precision scale, 30kg capacity", [99, 249], [3, 15]],
    ["Pallet Jack 2500kg", "Manual hydraulic pallet truck, 2500kg capacity", [199, 499], [2, 10]],
    ["Stacker Hand", "Manual hand stacker lifter, 1000kg, 3m lift height", [499, 999], [1, 8]],
    ["Stretch Wrapper", "Semi-automatic pallet stretch wrapping machine", [999, 1999], [1, 5]],
    ["Conveyor Belt 2m", "2-metre motorised conveyor belt, 40kg capacity", [499, 999], [1, 5]],
    ["Air Compressor", "50L oil-lubricated air compressor, 10 bar", [199, 499], [2, 10]],
    ["Pneumatic Nailer", "Framing pneumatic nail gun with carry case", [99, 249], [3, 15]],
    ["Pressure Washer", "2200W high-pressure washer with 10m hose", [99, 299], [3, 15]],
    ["Shop Vacuum", "30L industrial wet/dry vacuum cleaner", [79, 199], [3, 15]],
    ["Industrial Fan", "Industrial drum fan, 750mm, 230V", [99, 249], [3, 15]],
    ["Warehouse Heater", "Industrial electric fan heater, 18kW", [299, 699], [1, 8]],
    ["Safety Sign Kit", "ISO 7010 safety sign starter kit, 20 signs", [29, 79], [10, 50]],
    ["First Aid Cabinet", "Fully stocked workplace first aid cabinet", [49, 149], [3, 20]],
    ["Fire Extinguisher 6kg", "6kg CO₂ fire extinguisher with bracket", [49, 119], [5, 30]],
    ["Eye Wash Station", "Wall-mounted emergency eye wash station", [49, 119], [3, 20]],
    ["Safety Bollard", "Heavy-duty steel safety bollard, yellow, 1m", [49, 129], [5, 30]],
    ["Pallet Rack Level", "Extra level for 90×180cm pallet racking", [79, 199], [3, 15]],
    ["Wire Shelving", "Chrome wire shelving unit, 5 levels, 180×90×45cm", [79, 199], [3, 15]],
    ["Storage Bin Kit", "50-bin wall-mount plastic storage bin kit", [49, 129], [3, 20]],
    ["Drum Dolly", "200L drum dolly with swivel casters", [49, 129], [3, 15]],
    ["Forklift Scale", "Wireless forklift mounting weigh scale, 5000kg", [499, 999], [1, 5]],
    ["Loading Ramp", "Aluminium folding loading ramp, 450kg capacity", [199, 499], [1, 8]],
    ["Anti-Fatigue Mat", "Industrial anti-fatigue rubber mat, 90×150cm", [29, 79], [10, 50]],
    ["Mesh Safety Gloves", "Cut-level F stainless mesh safety gloves, size M", [29, 79], [10, 50]],
  ],
  Software: [
    ["Antivirus 1 Year", "1-year antivirus and internet security licence, 3 devices", [29, 59], [20, 100]],
    ["Antivirus 2 Year", "2-year antivirus and internet security licence, 5 devices", [49, 99], [10, 60]],
    ["VPN Licence 1 Year", "1-year VPN service licence, unlimited devices", [39, 79], [20, 100]],
    ["VPN Licence 2 Year", "2-year VPN service licence, unlimited devices", [59, 119], [10, 60]],
    ["Office Suite Licence", "Productivity office suite perpetual licence, 1 PC", [99, 199], [10, 60]],
    ["PDF Editor Pro", "PDF editing and conversion software licence, 1 PC", [49, 99], [10, 60]],
    ["Password Manager", "Password manager premium licence, 1 year, 5 users", [29, 59], [20, 100]],
    ["Cloud Storage 1TB", "1TB cloud storage subscription, 1 year", [19, 49], [20, 100]],
    ["Cloud Storage 5TB", "5TB cloud storage subscription, 1 year", [39, 99], [10, 60]],
    ["Backup Software", "Automated cloud backup software, 1 year, 5 devices", [39, 79], [10, 60]],
    ["Remote Desktop Pro", "Remote desktop access software, 1 year, 3 devices", [49, 99], [10, 60]],
    ["Project Management", "Project management tool annual licence, 10 users", [99, 249], [5, 30]],
    ["Accounting Software", "Small-business accounting software, 1 year", [99, 249], [5, 30]],
    ["Design Suite", "Vector and raster design suite perpetual licence", [199, 499], [5, 20]],
    ["Video Editor Pro", "Professional video editing software licence", [99, 299], [5, 20]],
    ["Screen Recorder", "Screen and audio recording software, lifetime", [29, 79], [10, 50]],
    ["Font Pack", "600 premium professional fonts collection, lifetime", [29, 79], [10, 50]],
    ["Stock Photo Bundle", "500 royalty-free stock photos and illustrations pack", [19, 49], [20, 80]],
    ["Icon Pack Pro", "5000-icon professional UI icon pack, all formats", [19, 49], [20, 80]],
    ["Template Bundle", "100 premium business document template pack", [19, 49], [20, 80]],
    ["Dev Tools Licence", "IDE and developer tools annual licence, 1 seat", [99, 199], [5, 30]],
    ["Version Control", "Git repository hosting annual plan, 5 users", [49, 99], [5, 30]],
    ["CI/CD Pipeline", "Continuous integration pipeline annual licence", [99, 249], [3, 20]],
    ["API Gateway Licence", "API management and gateway annual plan", [149, 349], [2, 15]],
    ["Database Licence", "Relational database server annual licence", [199, 499], [2, 15]],
    ["CRM Starter", "Customer relationship management, 1 year, 5 users", [99, 249], [3, 20]],
    ["ERP Module", "ERP add-on module licence, 1 year", [199, 499], [2, 15]],
    ["HR Software", "HR management software annual licence, 50 employees", [99, 249], [3, 20]],
    ["Helpdesk Software", "Customer support helpdesk annual plan, 10 agents", [99, 249], [3, 20]],
    ["Email Marketing", "Email marketing platform, 1 year, 10K contacts", [49, 129], [5, 30]],
  ],
  Other: [
    ["Desk Plant", "Low-maintenance desk succulent in ceramic pot", [9, 29], [30, 120]],
    ["Air Plant Set", "Set of 5 tillandsia air plants with display stand", [15, 39], [20, 80]],
    ["White Noise Machine", "Sleep and focus white noise machine", [29, 79], [10, 60]],
    ["Aromatherapy Diffuser", "Ultrasonic essential oil diffuser with mood light", [19, 59], [15, 80]],
    ["Desk Fan", "USB desktop fan with 3 speeds and oscillation", [15, 39], [20, 80]],
    ["Portable Space Heater", "Compact ceramic space heater with thermostat", [29, 79], [10, 50]],
    ["Humidifier", "Cool-mist humidifier with 3-litre tank", [29, 79], [10, 50]],
    ["Dehumidifier", "Compact thermo-electric dehumidifier, 500ml/day", [39, 99], [5, 30]],
    ["Coffee Maker", "Single-serve pod coffee machine with milk frother", [49, 149], [5, 30]],
    ["Electric Kettle", "1.7L variable-temperature electric kettle", [29, 79], [10, 50]],
    ["Microwave Oven", "20L digital microwave with grill function", [79, 199], [3, 15]],
    ["Mini Fridge", "20L personal mini fridge for home or office", [79, 199], [3, 15]],
    ["Water Filter Jug", "5-stage activated carbon water filter jug, 3.5L", [29, 69], [15, 60]],
    ["Bluetooth Alarm Clock", "Bluetooth speaker alarm clock with USB charger", [29, 69], [15, 60]],
    ["Noise-Cancelling Fan", "Ultra-quiet bladeless desk fan with remote", [59, 149], [5, 30]],
    ["Desk Lamp LED", "Wireless charging LED desk lamp with USB-C port", [29, 79], [15, 60]],
    ["Floor Lamp", "LED arc floor lamp with adjustable colour temperature", [49, 129], [5, 30]],
    ["Night Light", "Rechargeable silicone night light with touch control", [9, 29], [30, 120]],
    ["Motivational Poster Set", "Set of 6 framed motivational office posters, A3", [19, 49], [15, 60]],
    ["Desk Calendar", "Perpetual bamboo desk calendar", [12, 29], [30, 120]],
    ["Pen Holder", "Concrete pen and pencil holder for desk", [9, 29], [30, 120]],
    ["Sticky Whiteboard", "A1 peel-and-stick whiteboard wall decal", [19, 49], [15, 60]],
    ["Cord Clips", "24-pack adhesive cable clips for desk cord management", [5, 15], [100, 300]],
    ["Reusable Notebook", "Erasable smart notebook with cloud sync", [19, 49], [20, 80]],
    ["Standing Mat Puzzle", "Puzzle-piece interlocking foam standing mat set", [19, 49], [15, 60]],
    ["Screen Cleaning Kit", "Screen cleaning spray and microfibre cloth set", [9, 19], [50, 200]],
    ["Compressed Air Duster", "Electronic compressed air duster, rechargeable", [19, 49], [20, 80]],
    ["Anti-Static Brush", "Anti-static electronics cleaning brush set", [9, 19], [50, 200]],
    ["Thermal Paste Tube", "Premium 4g CPU thermal compound tube", [9, 19], [50, 200]],
    ["Monitor Cleaning Set", "Monitor wipes and microfibre cleaning cloth pack", [9, 19], [100, 300]],
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function randPrice([lo, hi]) {
  const raw = rand(lo, hi);
  // Round to nearest .49 or .99
  const base = Math.floor(raw);
  const cents = Math.random() < 0.5 ? 0.49 : 0.99;
  return Math.max(lo, base + cents);
}

const CAT_PREFIX = {
  "Electronics":           "ELE",
  "Computer Accessories":  "CAC",
  "Hardware":              "HRW",
  "Accessories":           "ACC",
  "Office Equipment":      "OEQ",
  "Furniture":             "FUR",
  "Industrial Equipment":  "IEQ",
  "Software":              "SFT",
  "Other":                 "OTH",
};

const catCounters = {};

function sku(category) {
  catCounters[category] = (catCounters[category] || 0) + 1;
  const prefix = CAT_PREFIX[category] || "GEN";
  return `${prefix}-${String(catCounters[category]).padStart(3, "0")}`;
}

// ── Build product list ────────────────────────────────────────────────────────

function buildProducts() {
  const products = [];
  for (const [category, items] of Object.entries(CATALOGUE)) {
    for (const [baseName, description, priceRange, stockRange] of items) {
      // Variants: 4 units per catalogue entry → roughly 8 categories × ~30 items × 4 = ~960,
      // plus a few extras to reach 1000.
      const variants = [
        { suffix: "", multiplier: 1.0 },
        { suffix: " Pro",    multiplier: 1.35 },
        { suffix: " Lite",   multiplier: 0.70 },
        { suffix: " Bundle", multiplier: 1.55 },
      ];

      for (const { suffix, multiplier } of variants) {
        const name  = baseName + suffix;
        const price = +(randPrice(priceRange) * multiplier).toFixed(2);
        const stock = randInt(...stockRange);
        const reorderPoint = Math.max(5, Math.floor(stockRange[0] * 0.8));

        products.push({
          name,
          description: suffix === ""        ? description
                     : suffix === " Pro"    ? description.replace(/\./,"") + ", premium edition."
                     : suffix === " Lite"   ? description.replace(/\./,"") + ", entry-level edition."
                     :                        description.replace(/\./,"") + " — includes accessories bundle.",
          price,
          stock,
          sku: sku(category),
          category,
          reorder_point: reorderPoint,
        });
      }
    }
  }

  // Trim or pad to exactly 1000
  return products.slice(0, 1000);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  try {
    // Resolve company_id
    const { rows: companyRows } = await client.query(
      "SELECT id FROM companies WHERE name = 'Aqred' LIMIT 1"
    );
    if (!companyRows.length) {
      console.error("❌  Company 'Aqred' not found. Run the backend server once to run migrations first.");
      process.exit(1);
    }
    const companyId = companyRows[0].id;
    console.log(`✅  Company resolved: Aqred (id=${companyId})`);

    const products = buildProducts();
    console.log(`📦  Inserting ${products.length} products...`);

    await client.query("BEGIN");

    let inserted = 0;
    let skipped  = 0;

    for (const p of products) {
      const result = await client.query(
        `INSERT INTO products (name, description, price, stock, sku, category, reorder_point, company_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (sku) DO NOTHING`,
        [p.name, p.description, p.price, p.stock, p.sku, p.category, p.reorder_point, companyId]
      );
      if (result.rowCount > 0) inserted++;
      else skipped++;
    }

    await client.query("COMMIT");

    console.log(`✅  Done — ${inserted} inserted, ${skipped} already existed (skipped).`);

    // Quick sanity check
    const { rows: countRows } = await client.query(
      "SELECT COUNT(*) FROM products WHERE company_id = $1", [companyId]
    );
    console.log(`📊  Total products for Aqred: ${countRows[0].count}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
