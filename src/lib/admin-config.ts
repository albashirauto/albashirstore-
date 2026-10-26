// One entry per editable table. The admin panel builds its list + form from this.
// To add a new field later: add it to the SQL table, then add a line here.

export type FieldType = "text" | "textarea" | "html" | "number" | "bool" | "select" | "image" | "images" | "slug" | "datetime";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  /** for type "select": load options from another table */
  relation?: { table: string; label: string };
  /** for type "select": fixed options */
  options?: { value: string; label: string }[];
  /** for type "slug": which field to build the slug from */
  from?: string;
  half?: boolean;
  /** stored in another (admin-only) table keyed by this row id, e.g. private cost prices */
  side?: { table: string; fk: string };
};

export type Column = { key: string; label: string; kind?: "text" | "image" | "bool" | "money" | "relation"; relation?: { table: string; label: string } };

export type Resource = {
  table: string;
  title: string;
  singular: string;
  description: string;
  orderBy: string;
  ascending?: boolean;
  columns: Column[];
  fields: Field[];
  searchKey: string;
  /** show the Rank Math-style SEO score for this table (category / brand pages) */
  seo?: "category" | "brand";
};

const sort: Field = { key: "sort_order", label: "Sort order", type: "number", half: true, help: "Lower numbers show first." };
const active: Field = { key: "active", label: "Visible on the website", type: "bool", half: true };

export const RESOURCES: Record<string, Resource> = {
  products: {
    table: "products", title: "Products", singular: "product", searchKey: "name", orderBy: "created_at", ascending: false,
    description: "Every part you sell: price, stock, photos, category, brand, bike and promotion.",
    columns: [
      { key: "images", label: "Photo", kind: "image" }, { key: "name", label: "Name" }, { key: "price", label: "Price", kind: "money" },
      { key: "stock", label: "Stock" }, { key: "scheme_buy", label: "Scheme buy" }, { key: "scheme_free", label: "Free" }, { key: "category_id", label: "Category", kind: "relation", relation: { table: "categories", label: "name" } },
      { key: "is_trending", label: "Trending", kind: "bool" }, { key: "active", label: "Live", kind: "bool" },
    ],
    fields: [
      { key: "name", label: "Product name", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "name", required: true, half: true },
      { key: "sku", label: "SKU / part number", type: "text", half: true },
      { key: "price", label: "Price (Rs.)", type: "number", required: true, half: true },
      { key: "cost_price", label: "Cost price (Rs.), private", type: "number", half: true, side: { table: "product_costs", fk: "product_id" }, help: "What you paid. Only admins see it. Used for profit." },
      { key: "compare_price", label: "Old price (shows as discount)", type: "number", half: true },
      { key: "stock", label: "Stock quantity", type: "number", half: true },
      { key: "category_id", label: "Category", type: "select", relation: { table: "categories", label: "name" }, half: true },
      { key: "brand_id", label: "Brand", type: "select", relation: { table: "brands", label: "name" }, half: true },
      { key: "vehicle_id", label: "Fits bike / vehicle", type: "select", relation: { table: "vehicles", label: "name" }, half: true },
      { key: "fitment_verified", label: "Fitment checked (fits this bike for sure)", type: "bool", half: true },
      { key: "promotion_id", label: "Promotion", type: "select", relation: { table: "promotions", label: "title" }, half: true },
      { key: "scheme_buy", label: "Scheme: buy (pieces)", type: "number", half: true, help: "e.g. 20. Leave empty for no scheme." },
      { key: "scheme_free", label: "Scheme: free (pieces)", type: "number", half: true, help: "e.g. 5, so: buy 20 get 5 free." },
      { key: "images", label: "Photos", type: "images", help: "First photo is the main one." },
      { key: "description", label: "Description", type: "textarea" },
      { key: "is_featured", label: "Show in Staff picks", type: "bool", half: true },
      { key: "is_trending", label: "Show in Trending", type: "bool", half: true },
      active,
    ],
  },
  categories: {
    table: "categories", title: "Categories", singular: "category", searchKey: "name", orderBy: "sort_order", seo: "category",
    description: "Groups of parts. They appear in the menu, on the home page and in filters.",
    columns: [{ key: "image", label: "Image", kind: "image" }, { key: "name", label: "Name" }, { key: "parent_id", label: "Main category", kind: "relation", relation: { table: "categories", label: "name" } }, { key: "show_in_nav", label: "In menu", kind: "bool" }, { key: "show_on_home", label: "On home", kind: "bool" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "name", required: true },
      { key: "parent_id", label: "Main category (leave empty for a main category)", type: "select", relation: { table: "categories", label: "name" }, help: "Pick a main category to make this a sub-category." },
      { key: "image", label: "Picture", type: "image", help: "Square photo. Shown on category tiles, the menu and the category page." },
      { key: "description_html", label: "Description (shown on the category page)", type: "html" },
      { key: "seo_title", label: "SEO title", type: "text", help: "Google title. Empty = automatic." },
      { key: "seo_description", label: "SEO description", type: "textarea", help: "120–160 characters for Google." },
      { key: "focus_keywords", label: "Focus keywords", type: "text", help: "Comma separated, e.g. brake shoes, cd 70 brake" },
      { key: "show_in_nav", label: "Show in top menu", type: "bool", half: true },
      { key: "show_on_home", label: "Show on home page", type: "bool", half: true },
      sort, active,
    ],
  },
  brands: {
    table: "brands", title: "Brands", singular: "brand", searchKey: "name", orderBy: "sort_order", seo: "brand",
    description: "Honda, RP Speedo, ISH, TQR… Upload a logo once and it shows across the whole website.",
    columns: [{ key: "logo", label: "Logo", kind: "image" }, { key: "name", label: "Name" }, { key: "country", label: "Country" }, { key: "supplier_name", label: "Supplier" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "name", label: "Brand name", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "name", required: true },
      { key: "logo", label: "Logo", type: "image", help: "PNG with transparent or white background. Shown on product cards, product pages, the menu and brand pages." },
      { key: "country", label: "Country", type: "text", half: true, help: "e.g. Pakistan, Japan, China" },
      { key: "website", label: "Website", type: "text", half: true },
      { key: "description_html", label: "About the brand (shown on the brand page)", type: "html" },
      { key: "seo_title", label: "SEO title", type: "text", help: "Google title. Empty = automatic." },
      { key: "seo_description", label: "SEO description", type: "textarea", help: "120–160 characters for Google." },
      { key: "focus_keywords", label: "Focus keywords", type: "text", help: "Comma separated, e.g. brake shoes, cd 70 brake" },
      { key: "supplier_name", label: "Supplier name (private)", type: "text", half: true, side: { table: "brand_suppliers", fk: "brand_id" } },
      { key: "supplier_phone", label: "Supplier phone (private)", type: "text", half: true, side: { table: "brand_suppliers", fk: "brand_id" } },
      { key: "supplier_notes", label: "Supplier notes (private)", type: "textarea", side: { table: "brand_suppliers", fk: "brand_id" }, help: "Only admins can see these three fields." },
      sort, active,
    ],
  },
  vehicles: {
    table: "vehicles", title: "Bikes & parts companies", singular: "bike / vehicle", searchKey: "name", orderBy: "sort_order",
    description: "Models your parts fit: Honda CD 70, CG 125, rickshaws, loaders, cycles.",
    columns: [{ key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "company", label: "Company" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "name", label: "Model name", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "name", required: true },
      { key: "type", label: "Type", type: "select", half: true, options: [{ value: "motorcycle", label: "Motorcycle" }, { value: "rickshaw", label: "Rickshaw" }, { value: "loader", label: "Loader" }, { value: "cycle", label: "Cycle" }, { value: "other", label: "Other" }] },
      { key: "company", label: "Company (Honda, Suzuki…)", type: "text", half: true },
      { key: "image", label: "Image (optional)", type: "image" }, sort, active,
    ],
  },
  promotions: {
    table: "promotions", title: "Promotions", singular: "promotion", searchKey: "title", orderBy: "sort_order",
    description: "Offers. Give each one a rule (e.g. under Rs. 999, 30% off or more) and products join it by themselves; you can also assign products by hand.",
    columns: [{ key: "title", label: "Title" }, { key: "badge", label: "Badge" }, { key: "rule", label: "Fills by" }, { key: "rule_value", label: "Value" }, { key: "show_on_home", label: "On home", kind: "bool" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "title", required: true },
      { key: "subtitle", label: "Short description", type: "text" },
      { key: "badge", label: "Badge text (e.g. 30% OFF)", type: "text", half: true },
      { key: "rule", label: "Fill automatically with…", type: "select", half: true, help: "New and changed products join by themselves. Products you assign by hand always show too.", options: [
        { value: "manual", label: "Only products I assign by hand" }, { value: "under_price", label: "Products under a price (Rs.)" },
        { value: "min_discount", label: "Products with at least X% off" }, { value: "scheme", label: "Products with a bulk scheme" },
        { value: "new", label: "New products (last X days)" }, { value: "best_sellers", label: "Best sellers (last X days)" },
      ] },
      { key: "rule_value", label: "Rule number", type: "number", half: true, help: "Price in Rs., % off, or number of days. e.g. 999, 30, 14" },
      { key: "image", label: "Background image (optional)", type: "image" },
      { key: "starts_at", label: "Starts", type: "datetime", half: true }, { key: "ends_at", label: "Ends", type: "datetime", half: true },
      { key: "show_on_home", label: "Show on home page", type: "bool", half: true }, sort, active,
    ],
  },
  banners: {
    table: "banners", title: "Home banners", singular: "banner", searchKey: "title", orderBy: "sort_order",
    description: "The big sliding banners at the top of the home page.",
    columns: [{ key: "image", label: "Image", kind: "image" }, { key: "title", label: "Headline" }, { key: "link", label: "Link" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "eyebrow", label: "Small text above headline", type: "text" },
      { key: "title", label: "Headline", type: "text", required: true },
      { key: "subtitle", label: "Text under headline", type: "textarea" },
      { key: "button_text", label: "Button text", type: "text", half: true }, { key: "link", label: "Button link (e.g. /shop)", type: "text", half: true },
      { key: "image", label: "Picture on the right (optional PNG with transparent background)", type: "image" }, sort, active,
    ],
  },
  pages: {
    table: "pages", title: "Pages", singular: "page", searchKey: "title", orderBy: "title",
    description: "About, Contact, policies and any other page. Shows at /pages/your-slug.",
    columns: [{ key: "title", label: "Title" }, { key: "slug", label: "Address" }, { key: "show_in_footer", label: "In footer", kind: "bool" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "title", label: "Page title", type: "text", required: true },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "title", required: true },
      { key: "content", label: "Page content", type: "html" },
      { key: "show_in_footer", label: "Show link in footer", type: "bool", half: true }, active,
    ],
  },
  testimonials: {
    table: "testimonials", title: "Reviews", singular: "review", searchKey: "name", orderBy: "sort_order",
    description: "Customer reviews shown on the home page (“What customers say”).",
    columns: [{ key: "name", label: "Name" }, { key: "city", label: "City" }, { key: "rating", label: "Stars" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [{ key: "name", label: "Customer name", type: "text", required: true, half: true }, { key: "city", label: "City", type: "text", half: true }, { key: "body", label: "Review", type: "textarea", required: true }, { key: "rating", label: "Stars (1-5)", type: "number", half: true }, sort, active],
  },
  faqs: {
    table: "faqs", title: "FAQs", singular: "question", searchKey: "question", orderBy: "sort_order",
    description: "Questions and answers on the Contact page. Only one answer opens at a time.",
    columns: [{ key: "question", label: "Question" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      sort, active,
    ],
  },
  posts: {
    table: "posts", title: "Blog", singular: "post", searchKey: "title", orderBy: "published_at", ascending: false,
    description: "Helpful articles (fitment guides, maintenance tips, new stock). Good for Google: each post gets its own page.",
    columns: [{ key: "cover", label: "Cover", kind: "image" }, { key: "title", label: "Title" }, { key: "author", label: "Author" }, { key: "published_at", label: "Published" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "title", label: "Title", type: "text", required: true, help: "e.g. How to tell your CD 70 chain kit is worn" },
      { key: "slug", label: "Web address (slug)", type: "slug", from: "title", required: true, half: true },
      { key: "author", label: "Author", type: "text", half: true },
      { key: "cover", label: "Cover picture", type: "image", help: "Wide photo, about 1200 × 630." },
      { key: "excerpt", label: "Short summary", type: "textarea", help: "1–2 lines for the blog list and Google." },
      { key: "content_html", label: "Article", type: "html" },
      { key: "published_at", label: "Publish date", type: "datetime", half: true, help: "Future date = scheduled." },
      { key: "seo_title", label: "SEO title", type: "text", half: true, help: "Empty = the title." },
      { key: "seo_description", label: "SEO description", type: "textarea", help: "120–160 characters. Empty = the summary." },
      { key: "focus_keywords", label: "Focus keywords", type: "text", help: "Comma separated." },
      { key: "active", label: "Published (off = draft)", type: "bool", half: true },
    ],
  },
  features: {
    table: "features", title: "Trust bar", singular: "highlight", searchKey: "title", orderBy: "sort_order",
    description: "The four highlights under the banner (delivery, support, exchange…).",
    columns: [{ key: "title", label: "Title" }, { key: "icon", label: "Icon" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Live", kind: "bool" }],
    fields: [
      { key: "title", label: "Title", type: "text", required: true }, { key: "body", label: "Text", type: "textarea" },
      { key: "icon", label: "Icon", type: "select", half: true, options: [{ value: "truck", label: "Truck" }, { value: "shield", label: "Shield" }, { value: "headset", label: "Headset" }, { value: "refresh", label: "Exchange" }, { value: "tag", label: "Tag" }, { value: "badge", label: "Badge" }] },
      sort, active,
    ],
  },
};

export type NavItem = { href: string; label: string; /** hidden from staff, never grantable */ ownerOnly?: boolean };
/** Admin sidebar, in groups. Icons live in AdminShell (keyed by href). */
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/activity", label: "Activity log" },
  ] },
  { title: "Catalog", items: [
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/brands", label: "Brands" },
    { href: "/admin/vehicles", label: "Bikes & companies" },
    { href: "/admin/promotions", label: "Promotions" },
    { href: "/admin/reviews", label: "Product reviews" },
  ] },
  { title: "Content", items: [
    { href: "/admin/posts", label: "Blog" },
    { href: "/admin/pages", label: "Pages" },
    { href: "/admin/faqs", label: "FAQs" },
    { href: "/admin/testimonials", label: "Testimonials" },
    { href: "/admin/banners", label: "Home banners" },
    { href: "/admin/media", label: "Media library" },
    { href: "/admin/features", label: "Trust bar" },
  ] },
  { title: "Marketing", items: [
    { href: "/admin/campaigns", label: "Campaigns (popups)" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/carts", label: "Abandoned carts" },
    { href: "/admin/newsletter", label: "Newsletter" },
  ] },
  { title: "Settings", items: [
    { href: "/admin/settings", label: "Store settings" },
    { href: "/admin/redirects", label: "Redirects & 404s" },
    { href: "/admin/team", label: "Team", ownerOnly: true },
    { href: "/admin/notifications", label: "Notifications", ownerOnly: true },
  ] },
];


/** Sections an owner can grant to staff (the Team page shows these as tick boxes). */
export const GRANTABLE = NAV_GROUPS.flatMap((g) => g.items.filter((i) => !i.ownerOnly).map((i) => ({ ...i, group: g.title })));
