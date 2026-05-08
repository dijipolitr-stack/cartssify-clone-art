import cart12Natural from "@/assets/cart-12-natural.jpg";

export type Product = {
  slug: string;
  title: string;
  price: string;
  image: string;
  gallery?: string[];
  tagline?: string;
  description: string;
  features: string[];
  specs?: { label: string; value: string }[];
};

const baseDescription =
  "High-quality, portable display solution designed for events, pop-ups and on-the-go retail. Built from durable plywood with a clean, modern design that puts your brand at the center.";

const baseFeatures = [
  "Customizable front panel — insert your logo or artwork",
  "Foldable, flat-pack design for easy transport",
  "Smooth wheels with brakes for secure placement",
  "Built from 12mm thick plywood for daily commercial use",
];

export const products: Product[] = [
  {
    slug: "cart-12-natural",
    title: "Cart 12 Natural",
    price: "$1,800.00 USD",
    image: cart12Natural,
    gallery: [],
    tagline: "Mobile Coffee Cart — Natural Plywood",
    description:
      "Showcase your products in style with our flagship Mobile Coffee Cart. Designed with mobility in mind, it disassembles into a flat-pack secured with a safety belt — transportation is as simple as packing a suitcase.",
    features: [
      ...baseFeatures,
      "Worktop holds up to 150kg (265 lbs)",
      "Each shelf supports up to 80kg (176 lbs)",
    ],
    specs: [
      { label: "Length", value: "180 cm (70.9 in)" },
      { label: "Depth", value: "75 cm (29.5 in)" },
      { label: "Height", value: "95 cm (37.6 in)" },
      { label: "Total weight", value: "50 kg (110 lbs)" },
    ],
  },
  {
    slug: "display-cart-12-black",
    title: "Display Cart 12 - Black",
    price: "$1,950.00 USD",
    image: "https://cartssify.com/cdn/shop/files/Untitled_design_6.png?v=1718196398&width=1200",
    tagline: "Display Cart 12 in matte black",
    description:
      "The bold, all-black version of our most popular cart. Perfect for premium brands that want a sleek, statement-making display piece for events, pop-ups and retail floors.",
    features: baseFeatures,
    specs: [
      { label: "Length", value: "180 cm (70.9 in)" },
      { label: "Depth", value: "75 cm (29.5 in)" },
      { label: "Height", value: "95 cm (37.6 in)" },
    ],
  },
  {
    slug: "cart-15-black-heavy-duty",
    title: "Cart 15 Black Heavy Duty",
    price: "$2,200.00 USD",
    image: "https://cartssify.com/cdn/shop/files/Untitled_design_10.png?v=1718197320&width=1200",
    tagline: "Heavy-duty, larger format display cart",
    description:
      "Our largest cart, built for high-traffic environments and heavier displays. The 15mm plywood construction adds strength while preserving the clean Rumicarts silhouette.",
    features: [
      ...baseFeatures,
      "15mm plywood construction for extra strength",
      "Higher load capacity for heavier displays",
    ],
  },
  {
    slug: "extra-shelf",
    title: "Extra Shelf",
    price: "$100.00 USD",
    image: "https://cartssify.com/cdn/shop/files/Shoppify_product_photo.png?v=1718211467&width=1200",
    tagline: "Add-on shelf for any Rumicarts display cart",
    description:
      "An additional shelf for your display cart, giving you more storage and merchandising space. Compatible with all standard Rumicarts models and adjustable to multiple heights.",
    features: [
      "Compatible with all standard Rumicarts display carts",
      "Adjustable to 3 different heights",
      "Supports up to 80 kg (176 lbs)",
      "Matches your cart's finish",
    ],
  },
  {
    slug: "slide-in-logo-front-panel",
    title: "Slide-in Logo Option for Front Panel",
    price: "$100.00 USD",
    image: "https://cartssify.com/cdn/shop/files/Untitled_design_12.png?v=1718197708&width=1200",
    tagline: "Brand your cart in seconds",
    description:
      "A custom front-panel slot that lets you slide in printed logos or campaign artwork without damaging the cart. Swap visuals between events, seasons, or pop-ups.",
    features: [
      "Easy slide-in / slide-out artwork system",
      "No damage to the cart finish",
      "Perfect for seasonal campaigns and rotating brands",
    ],
  },
  {
    slug: "mobile-coffee-cart-fabric-roof-canopy",
    title: "Mobile Coffee Cart with Fabric Roof Canopy",
    price: "From $2,900.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.950.png?v=1759158026&width=1200",
    tagline: "Cart 12 with integrated fabric canopy",
    description:
      "Our Mobile Coffee Cart paired with a removable fabric roof canopy — adding shade, presence and a strong silhouette for outdoor events and street vendors.",
    features: [
      ...baseFeatures,
      "Removable fabric canopy in multiple colors",
      "Stronger visual presence for outdoor events",
    ],
  },
  {
    slug: "sink-edition",
    title: "Sink Edition",
    price: "From $2,500.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.948.png?v=1759157265&width=1200",
    tagline: "Display cart with built-in sink module",
    description:
      "A purpose-built version of our display cart with an integrated sink module — ideal for coffee, cocktails, juice bars and any pop-up that needs water on the go.",
    features: [
      "Integrated stainless steel sink",
      "Compatible with portable water tanks",
      "Same flat-pack mobility as the standard cart",
    ],
  },
  {
    slug: "2-cart-straight-line-mobile-bar",
    title: "2-Cart Straight-Line Mobile Bar",
    price: "From $4,310.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.938.png?v=1759156233&width=1200",
    tagline: "Two carts joined into a continuous bar",
    description:
      "Two display carts connected with a straight connector to form a continuous, professional event counter — perfect for bars, sampling stations and product launches.",
    features: [
      "Two carts + straight connector included",
      "Forms a continuous 3.6m bar surface",
      "Modular: separate carts for smaller events",
    ],
  },
  {
    slug: "l-shaped-mobile-bar-closed-corner-2-cart",
    title: "L-Shaped Mobile Cart System – Closed Corner (2-Cart)",
    price: "From $4,460.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.933.png?v=1759155564&width=1200",
    tagline: "Two-cart L-shape with a closed corner",
    description:
      "An L-shaped two-cart configuration with a closed corner module — a compact, professional setup for tight venues that still need a serving bar feel.",
    features: [
      "Two carts + closed corner connector",
      "Compact L-shape footprint",
      "Easy to break down into individual carts",
    ],
  },
  {
    slug: "l-shaped-mobile-bar-open-corner-2-cart",
    title: "2-Cart L-Shaped Mobile Bar – Open Corner",
    price: "From $4,260.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.927_cecf137e-2e1c-4e5d-84f1-823dfeb07d6c.png?v=1759155071&width=1200",
    tagline: "Two-cart L-shape with an open corner",
    description:
      "An L-shape with an open corner — gives staff free movement between both sides while presenting a professional bar to customers.",
    features: [
      "Two carts + open corner module",
      "Open access for staff movement",
      "Modular: rearrange for any venue",
    ],
  },
  {
    slug: "open-corner-mobile-bar-3-cart",
    title: "Open Corner Mobile Bar Setup – 3-Cart Modular",
    price: "From $6,590.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.921.png?v=1759154869&width=1200",
    tagline: "Three carts with open corners",
    description:
      "A three-cart modular setup with open corners — ideal for medium events that need a substantial bar without sacrificing staff flow.",
    features: [
      "Three carts + open corner connectors",
      "Substantial bar presence",
      "Modular flat-pack transport",
    ],
  },
  {
    slug: "l-shaped-mobile-display-counter",
    title: "L-Shaped Mobile Display Counter",
    price: "From $6,790.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V5.916.png?v=1759154739&width=1200",
    tagline: "L-shape with corner & straight connectors",
    description:
      "Combines straight and corner connectors into a single L-shaped display counter — flexible, professional, and ready for serious event work.",
    features: [
      "Combines straight + corner connectors",
      "Flexible L-shape configuration",
      "Modular Rumicarts system",
    ],
  },
  {
    slug: "modular-u-shaped-mobile-event-bar",
    title: "Modular U-Shaped Mobile Event Bar – 4-Cart",
    price: "From $8,370.00 USD",
    image: "https://cartssify.com/cdn/shop/files/V3.908.png?v=1759154466&width=1200",
    tagline: "Four-cart professional U-shape",
    description:
      "Our top-of-the-line modular setup: four carts in a U-shape that creates a fully enclosed bar for staff with maximum customer-facing surface area.",
    features: [
      "Four carts + connectors included",
      "Fully enclosed bar workspace for staff",
      "Maximum customer-facing surface",
    ],
  },
  {
    slug: "mobile-coffee-cart-display-stands-set",
    title: "Mobile Coffee Cart and 3 Adjustable Display Stands Set",
    price: "$3,500.00 USD",
    image: "https://cartssify.com/cdn/shop/files/smallnew3.351.png?v=1740430342&width=1200",
    tagline: "Cart + matching display stands bundle",
    description:
      "A complete merchandising set: our Mobile Coffee Cart paired with 3 adjustable display stands. A turnkey solution for retailers launching pop-ups or trade-show booths.",
    features: [
      "Mobile Coffee Cart included",
      "3 adjustable display stands",
      "Turnkey solution for pop-ups and trade shows",
    ],
  },
  {
    slug: "display-cart-12-with-slide-in-logo",
    title: "Display Cart 12 Black with Slide-in Logo Function",
    price: "$2,100.00 USD",
    image: "https://cartssify.com/cdn/shop/files/Untitled_design_6.png?v=1718196398&width=1200",
    tagline: "Black Cart 12 with built-in logo slot",
    description:
      "Our black display cart with the slide-in logo function pre-installed — change brand artwork in seconds without modifying the cart.",
    features: [
      ...baseFeatures,
      "Built-in slide-in logo slot",
      "Swap artwork between events without tools",
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
