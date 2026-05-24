"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CakeSlice,
  ChevronRight,
  IceCreamBowl,
  Instagram,
  MapPin,
  Music2,
  Pizza,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

type CategoryId =
  | "cakes"
  | "burgers"
  | "sandwiches"
  | "protein"
  | "ice-cream"
  | "pastries"
  | "chops"
  | "pizza";

interface Price {
  readonly label?: string;
  readonly amount: string;
}

interface MenuItem {
  readonly id: string;
  readonly category: CategoryId;
  readonly name: string;
  readonly description: string;
  readonly details: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly prices: readonly Price[];
  readonly tags: readonly string[];
  readonly ingredients?: readonly string[];
}

interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly summary: string;
}

const sunflourWhatsAppPhone = "2348130000300";
const sunflourDisplayPhone = "08130000300";

const images = {
  cake:
    "https://cdn.pixabay.com/photo/2016/11/22/18/52/cake-1850011_1280.jpg",
  cakeLayer:
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
  cakeCelebration:
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
  cakeRoll:
    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=1200&q=80",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  burgerClassic:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  burgerStack:
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80",
  burgerPlate:
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1200&q=80",
  burgerDouble:
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=80",
  sandwich:
    "https://cdn.pixabay.com/photo/2022/03/11/10/06/wrap-7061741_1280.jpg",
  shawarma:
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
  sandwichGrilled:
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80",
  sandwichToast:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
  friedChicken:
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=80",
  friedChickenPlate:
    "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80",
  chickenPlate:
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80",
  iceCream:
    "https://images.unsplash.com/photo-1587563974670-b5181b459b30?auto=format&fit=crop&w=1200&q=80",
  iceCreamCone:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80",
  iceCreamScoops:
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1200&q=80",
  iceCreamCup:
    "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=1200&q=80",
  pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  pizzaSlice:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  pizzaTable:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
  pizzaOven:
    "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1200&q=80",
  pastry:
    "https://upload.wikimedia.org/wikipedia/commons/7/73/Sweeney_%26_Todd_meat_pie.jpg",
  doughnut:
    "https://cdn.pixabay.com/photo/2021/02/05/14/24/food-5984722_1280.jpg",
  doughnutBox:
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80",
  cookies:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
  croissant:
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
  chops:
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Meat_pie_samosa_and_spring_roll.jpg",
} as const;

const imagePools = {
  cakes: [images.cake, images.cakeLayer, images.cakeCelebration, images.cakeRoll],
  burgers: [
    images.burger,
    images.burgerClassic,
    images.burgerStack,
    images.burgerPlate,
    images.burgerDouble,
  ],
  sandwiches: [
    images.sandwich,
    images.shawarma,
    images.sandwichGrilled,
    images.sandwichToast,
  ],
  protein: [
    images.friedChicken,
    images.friedChickenPlate,
    images.chickenPlate,
  ],
  "ice-cream": [
    images.iceCream,
    images.iceCreamCone,
    images.iceCreamScoops,
    images.iceCreamCup,
  ],
  pastries: [
    images.pastry,
    images.doughnut,
    images.doughnutBox,
    images.cookies,
    images.croissant,
    images.pizzaSlice,
  ],
  chops: [
    images.chops,
    images.pastry,
    images.sandwich,
    images.doughnutBox,
  ],
  pizza: [images.pizza, images.pizzaSlice, images.pizzaTable, images.pizzaOven],
} satisfies Record<CategoryId, readonly string[]>;

const categories: readonly Category[] = [
  {
    id: "cakes",
    label: "Cakes",
    summary: "Soft bakery cuts and celebration sizes.",
  },
  {
    id: "burgers",
    label: "Burgers",
    summary: "Chicken, beef, double protein, and Lebanese-style options.",
  },
  {
    id: "sandwiches",
    label: "Sandwiches",
    summary: "Shawarma, fajita, fries sandwich, and chicken tabouk.",
  },
  {
    id: "protein",
    label: "Protein",
    summary: "Peppered fried chicken for a filling side or main bite.",
  },
  {
    id: "ice-cream",
    label: "Ice Cream",
    summary: "Scoops, cones, cups, flavours, and toppings.",
  },
  {
    id: "pastries",
    label: "Pastries",
    summary: "Pies, biscuits, cookies, doughnuts, and mini pizza.",
  },
  {
    id: "chops",
    label: "Chops",
    summary: "Party-style small chops and quick snacks.",
  },
  {
    id: "pizza",
    label: "Pizza",
    summary: "Regular and special pizzas with four serving sizes.",
  },
];

const baseMenuItems: readonly MenuItem[] = [
  {
    id: "swiss-roll",
    category: "cakes",
    name: "Swiss Roll",
    description: "Soft rolled sponge with a sweet cream-style finish.",
    details:
      "A light bakery roll for customers who want something sweet without ordering a full celebration cake.",
    image: images.cake,
    imageAlt: "Chocolate cake slice with soft bakery layers",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Cake", "Single order"],
    ingredients: ["Sponge cake", "Cream filling", "Bakery glaze"],
  },
  {
    id: "sponge-cake",
    category: "cakes",
    name: "Sponge Cake",
    description: "Classic soft cake with a simple, fluffy crumb.",
    details:
      "A clean bakery favourite for tea breaks, office bites, or a light dessert after a meal.",
    image: images.cake,
    imageAlt: "Fresh cake slice with chocolate layers",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Cake", "Bakery"],
    ingredients: ["Sponge cake", "Bakery frosting"],
  },
  {
    id: "coco-bean-cake",
    category: "cakes",
    name: "Coco Bean Cake",
    description: "Chocolate-forward cake with a richer bakery profile.",
    details:
      "Built for chocolate lovers who want a stronger cocoa note in a compact cake order.",
    image: images.cake,
    imageAlt: "Chocolate cake presented on a plate",
    prices: [{ amount: "NGN 2,200" }],
    tags: ["Cake", "Chocolate"],
    ingredients: ["Cocoa cake", "Chocolate finish"],
  },
  {
    id: "six-inch-cake",
    category: "cakes",
    name: "6 Inches Cake",
    description: "Compact celebration cake for small birthdays and surprises.",
    details:
      "A practical celebration size for intimate gatherings, office surprises, and small family moments.",
    image: images.cake,
    imageAlt: "Celebration cake with layered chocolate texture",
    prices: [{ amount: "NGN 8,000" }],
    tags: ["Cake", "Celebration"],
    ingredients: ["Bakery sponge", "Frosting", "Decorative finish"],
  },
  {
    id: "seven-inch-cake",
    category: "cakes",
    name: "7 Inches Cake",
    description: "Larger celebration cake with more serving room.",
    details:
      "A better fit when the table needs more slices while keeping the order simple and affordable.",
    image: images.cake,
    imageAlt: "Layered chocolate celebration cake",
    prices: [{ amount: "NGN 10,000" }],
    tags: ["Cake", "Celebration"],
    ingredients: ["Bakery sponge", "Frosting", "Decorative finish"],
  },
  {
    id: "chicken-burger-regular",
    category: "burgers",
    name: "Chicken Burger Regular",
    description: "Chicken burger with a soft bun, greens, and house sauce.",
    details:
      "A straight-to-the-point chicken burger for lunch, school runs, or a quick evening meal.",
    image: images.burger,
    imageAlt: "Chicken burger with lettuce and sauce",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Burger", "Chicken"],
    ingredients: ["Chicken patty", "Burger bun", "Lettuce", "House sauce"],
  },
  {
    id: "chicken-burger-special",
    category: "burgers",
    name: "Chicken Burger Special",
    description: "A fuller chicken burger with extra flavour and toppings.",
    details:
      "The upgraded chicken burger when the customer wants more texture, sauce, and bite.",
    image: images.burger,
    imageAlt: "Stacked burger with fresh vegetables",
    prices: [{ amount: "NGN 3,000" }],
    tags: ["Burger", "Special"],
    ingredients: ["Chicken patty", "Burger bun", "Vegetables", "House sauce"],
  },
  {
    id: "beef-burger-regular",
    category: "burgers",
    name: "Beef Burger Regular",
    description: "Beef patty burger with fresh vegetables and sauce.",
    details:
      "A classic beef burger for customers who want a simple, filling, familiar order.",
    image: images.burger,
    imageAlt: "Beef burger with lettuce and tomato",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Burger", "Beef"],
    ingredients: ["Beef patty", "Burger bun", "Lettuce", "Tomato", "Sauce"],
  },
  {
    id: "beef-burger-special",
    category: "burgers",
    name: "Beef Burger Special",
    description: "Richer beef burger with a fuller special-style build.",
    details:
      "A heavier beef burger option for customers who want more than the regular serving.",
    image: images.burger,
    imageAlt: "Large beef burger with melted cheese and vegetables",
    prices: [{ amount: "NGN 3,000" }],
    tags: ["Burger", "Special"],
    ingredients: ["Beef patty", "Burger bun", "Vegetables", "House sauce"],
  },
  {
    id: "lebanese-beef-burger-fries",
    category: "burgers",
    name: "Lebanese Beef Burger + Fries",
    description: "Beef patty, grilled onion, tomato, coleslaw, and fries.",
    details:
      "A more complete burger plate with a Lebanese-style build and fries included.",
    image: images.burger,
    imageAlt: "Burger served with fries",
    prices: [{ amount: "NGN 4,500" }],
    tags: ["Burger", "Fries included"],
    ingredients: ["Beef patty", "Grilled onion", "Tomato", "Coleslaw", "Fries"],
  },
  {
    id: "lebanese-chicken-burger",
    category: "burgers",
    name: "Lebanese Beef Chicken Burger",
    description: "Tomato, mayo, lettuce, pickles, and a rich burger build.",
    details:
      "A layered burger option with fresh crunch, creamy sauce, and pickled sharpness.",
    image: images.burger,
    imageAlt: "Chicken burger with lettuce and pickles",
    prices: [{ amount: "NGN 4,500" }],
    tags: ["Burger", "Lebanese style"],
    ingredients: ["Chicken", "Tomato", "Mayonnaise", "Lettuce", "Pickles"],
  },
  {
    id: "double-protein-burger",
    category: "burgers",
    name: "Double Protein Burger",
    description: "A protein-heavy burger for a more filling meal.",
    details:
      "A good pick when the customer wants a burger that eats like a main course.",
    image: images.burger,
    imageAlt: "Double burger with stacked patty",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Burger", "Protein"],
    ingredients: ["Double protein filling", "Burger bun", "House sauce"],
  },
  {
    id: "chicken-shawarma-regular",
    category: "sandwiches",
    name: "Chicken Shawarma Regular",
    description: "Chicken shawarma wrap with creamy sauce and vegetables.",
    details:
      "A dependable shawarma order for customers who want the classic chicken wrap.",
    image: images.sandwich,
    imageAlt: "Wrapped chicken sandwich with filling",
    prices: [{ amount: "NGN 4,000" }],
    tags: ["Shawarma", "Chicken"],
    ingredients: ["Chicken", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "chicken-shawarma-special",
    category: "sandwiches",
    name: "Chicken Shawarma Special",
    description: "Bigger chicken shawarma with a richer filling.",
    details:
      "The stronger chicken shawarma option for customers who want a fuller wrap.",
    image: images.sandwich,
    imageAlt: "Chicken wrap cut open with vegetables",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Shawarma", "Special"],
    ingredients: ["Chicken", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "beef-shawarma-regular",
    category: "sandwiches",
    name: "Beef Shawarma Regular",
    description: "Beef shawarma wrap with vegetables and sauce.",
    details:
      "A classic beef shawarma option with a warm wrap and savoury filling.",
    image: images.sandwich,
    imageAlt: "Beef shawarma style wrap",
    prices: [{ amount: "NGN 4,000" }],
    tags: ["Shawarma", "Beef"],
    ingredients: ["Beef", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "beef-shawarma-special",
    category: "sandwiches",
    name: "Beef Shawarma Special",
    description: "Larger beef shawarma with extra serving weight.",
    details:
      "A more filling beef shawarma for customers who want the upgraded wrap.",
    image: images.sandwich,
    imageAlt: "Loaded shawarma wrap with sauce",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Shawarma", "Special"],
    ingredients: ["Beef", "Flatbread", "Vegetables", "Creamy sauce"],
  },
  {
    id: "shawarma-burger",
    category: "sandwiches",
    name: "Shawarma Burger",
    description: "A burger-style shawarma option for quick, compact eating.",
    details:
      "A newer menu pick that combines the flavour direction of shawarma with the hand-held feel of a burger.",
    image: images.sandwich,
    imageAlt: "Grilled wrap sandwich with seasoned filling",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["New", "Shawarma"],
    ingredients: ["Shawarma filling", "Soft bread", "Vegetables", "Sauce"],
  },
  {
    id: "potato-fries-sandwich",
    category: "sandwiches",
    name: "Potato/Fries Sandwich",
    description: "French fries, coleslaw, and garlic sauce in a sandwich.",
    details:
      "A simple vegetarian-friendly fries sandwich with creamy crunch and garlic flavour.",
    image: images.sandwich,
    imageAlt: "Toasted wrap sandwich with fries filling",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Sandwich", "Fries"],
    ingredients: ["French fries", "Coleslaw", "Garlic sauce"],
  },
  {
    id: "fajita-sandwich",
    category: "sandwiches",
    name: "Fajita Sandwich",
    description: "Seasoned fajita-style filling in a warm sandwich.",
    details:
      "A savoury sandwich with fajita-style seasoning for customers who want a stronger flavour profile.",
    image: images.sandwich,
    imageAlt: "Fajita style wrap with seasoned filling",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Sandwich", "Fajita"],
    ingredients: ["Seasoned filling", "Vegetables", "Wrap", "Sauce"],
  },
  {
    id: "chicken-tabouk",
    category: "sandwiches",
    name: "Chicken Tabouk",
    description: "Seasoned chicken, coleslaw, garlic, and pickles.",
    details:
      "A sharp, creamy, and savoury chicken sandwich with the freshness of pickles and coleslaw.",
    image: images.sandwich,
    imageAlt: "Chicken sandwich wrap with vegetables",
    prices: [{ amount: "NGN 5,000" }],
    tags: ["Chicken", "Sandwich"],
    ingredients: ["Seasoned chicken", "Coleslaw", "Garlic", "Pickles"],
  },
  {
    id: "peppered-fried-chicken",
    category: "protein",
    name: "Peppered Fried Chicken",
    description: "Crispy fried chicken finished with peppered flavour.",
    details:
      "A bold protein order that works as a side with pizza, a snack plate, or a quick meal on its own.",
    image: images.friedChicken,
    imageAlt: "Crispy fried chicken pieces with sauce",
    prices: [{ amount: "NGN 3,500" }],
    tags: ["Protein", "Peppered"],
    ingredients: ["Fried chicken", "Pepper seasoning", "House spices"],
  },
  {
    id: "ice-cream-cone",
    category: "ice-cream",
    name: "Ice Cream Cone",
    description: "A crisp cone with your preferred available flavour.",
    details:
      "A quick cold treat for walk-ins, kids, and anyone who wants a simple ice cream order.",
    image: images.iceCream,
    imageAlt: "Scoops of ice cream in a cone",
    prices: [{ amount: "NGN 2,500" }],
    tags: ["Ice cream", "Cone"],
    ingredients: ["Cone", "Choice of available flavour"],
  },
  {
    id: "small-ice-cream-cup",
    category: "ice-cream",
    name: "Small Ice Cream Cup",
    description: "Two scoops served in a cup.",
    details:
      "A light cup serving for one person, with pricing based on selected scoop type.",
    image: images.iceCream,
    imageAlt: "Ice cream scoops in a cup",
    prices: [{ label: "2 scoops", amount: "NGN 3,500 / NGN 4,500" }],
    tags: ["Ice cream", "Cup"],
    ingredients: ["Two scoops", "Choice of available flavour"],
  },
  {
    id: "medium-ice-cream-cup",
    category: "ice-cream",
    name: "Medium Ice Cream Cup",
    description: "Three scoops for a fuller ice cream cup.",
    details:
      "A balanced cup size for customers who want variety without going jumbo.",
    image: images.iceCream,
    imageAlt: "Multiple ice cream scoops served cold",
    prices: [{ label: "3 scoops", amount: "NGN 4,500 / NGN 5,500" }],
    tags: ["Ice cream", "Cup"],
    ingredients: ["Three scoops", "Choice of available flavour"],
  },
  {
    id: "large-ice-cream-cup",
    category: "ice-cream",
    name: "Large Ice Cream Cup",
    description: "Four scoops for a generous cold dessert.",
    details:
      "A bigger cup for sharing lightly or for customers who want a full dessert order.",
    image: images.iceCream,
    imageAlt: "Large cup of colourful ice cream scoops",
    prices: [{ label: "4 scoops", amount: "NGN 7,000 / NGN 8,000" }],
    tags: ["Ice cream", "Large"],
    ingredients: ["Four scoops", "Choice of available flavour"],
  },
  {
    id: "jumbo-ice-cream",
    category: "ice-cream",
    name: "Jumbo Ice Cream",
    description: "Big plate serving for a full dessert experience.",
    details:
      "The largest ice cream option on the menu, best for customers who want a proper dessert plate.",
    image: images.iceCream,
    imageAlt: "Jumbo ice cream dessert serving",
    prices: [{ label: "Big plate", amount: "NGN 10,000" }],
    tags: ["Ice cream", "Jumbo"],
    ingredients: ["Large ice cream serving", "Choice of available flavour"],
  },
  ...[
    "Vanilla",
    "Strawberry",
    "Mix Fruit",
    "Chocolate",
    "Mango",
    "Creamy Milk",
    "Banana",
    "Bubble Gum",
    "Mars",
  ].map(
    (flavour): MenuItem => ({
      id: `ice-cream-${flavour.toLowerCase().replace(/\s+/g, "-")}`,
      category: "ice-cream",
      name: `${flavour} Ice Cream`,
      description: `${flavour} flavour available for cones and cup servings.`,
      details:
        "Choose this flavour with a cone or any cup size. Final price depends on the serving size selected.",
      image: images.iceCream,
      imageAlt: `${flavour} ice cream scoop`,
      prices: [{ amount: "Choose cone or cup size" }],
      tags: ["Flavour", "Ice cream"],
      ingredients: [flavour, "Ice cream base"],
    })
  ),
  ...["M&M", "Oreo", "Nuts", "Chocolate", "Edible Pearls"].map(
    (topping): MenuItem => ({
      id: `topping-${topping.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      category: "ice-cream",
      name: `${topping} Topping`,
      description: `Add ${topping} to your ice cream serving.`,
      details:
        "A simple add-on for customers who want more crunch, colour, or chocolate in their ice cream.",
      image: images.iceCream,
      imageAlt: `${topping} topping on ice cream`,
      prices: [{ amount: "NGN 500" }],
      tags: ["Topping", "Add-on"],
      ingredients: [topping],
    })
  ),
  {
    id: "meat-pie",
    category: "pastries",
    name: "Meat Pie",
    description: "Warm pastry with savoury meat filling.",
    details:
      "A bakery staple that works for breakfast, lunch breaks, and quick snack runs.",
    image: images.pastry,
    imageAlt: "Golden meat pie pastry",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Savoury"],
    ingredients: ["Pastry crust", "Meat filling"],
  },
  {
    id: "chicken-pie",
    category: "pastries",
    name: "Chicken Pie",
    description: "Golden pastry with chicken filling.",
    details:
      "A softer savoury pastry option for customers who prefer chicken over beef filling.",
    image: images.pastry,
    imageAlt: "Fresh savoury pie pastry",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Chicken"],
    ingredients: ["Pastry crust", "Chicken filling"],
  },
  {
    id: "jamaica-pie",
    category: "pastries",
    name: "Jamaica Pie",
    description: "Spiced savoury pie with a richer pastry profile.",
    details:
      "A more seasoned pastry for customers who want something bolder than the standard pie.",
    image: images.pastry,
    imageAlt: "Baked savoury hand pie",
    prices: [{ amount: "NGN 1,200" }],
    tags: ["Pastry", "Spiced"],
    ingredients: ["Pastry crust", "Seasoned filling"],
  },
  {
    id: "mini-pizza",
    category: "pastries",
    name: "Mini Pizza",
    description: "Small pizza-style pastry for quick snacking.",
    details:
      "A compact pizza bite for customers who want pizza flavour without ordering a full size.",
    image: images.pizza,
    imageAlt: "Mini pizza with cheese and toppings",
    prices: [{ amount: "NGN 2,000" }],
    tags: ["Pastry", "Pizza"],
    ingredients: ["Pizza dough", "Sauce", "Cheese", "Toppings"],
  },
  {
    id: "sable-biscuit",
    category: "pastries",
    name: "Sable Biscuit",
    description: "Crisp biscuit for a light bakery snack.",
    details:
      "A simple, budget-friendly biscuit order for tea breaks and light snacking.",
    image: images.pastry,
    imageAlt: "Crisp baked biscuit pastry",
    prices: [{ amount: "NGN 700" }],
    tags: ["Biscuit", "Bakery"],
    ingredients: ["Biscuit dough", "Bakery finish"],
  },
  {
    id: "cookies",
    category: "pastries",
    name: "Cookies",
    description: "Sweet bakery cookies with a crisp bite.",
    details:
      "A quick sweet option for customers who want something smaller than cake or doughnuts.",
    image: images.doughnut,
    imageAlt: "Sweet bakery treats and cookies",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Cookie", "Sweet"],
    ingredients: ["Cookie dough", "Sweet bakery finish"],
  },
  {
    id: "jam-doughnut",
    category: "pastries",
    name: "Jam Doughnut",
    description: "Soft doughnut with sweet jam filling.",
    details:
      "A familiar sweet pastry for customers who like a soft doughnut with a fruity centre.",
    image: images.doughnut,
    imageAlt: "Glazed doughnuts on a table",
    prices: [{ amount: "NGN 1,000" }],
    tags: ["Doughnut", "Sweet"],
    ingredients: ["Doughnut dough", "Jam filling"],
  },
  {
    id: "chocolate-doughnut",
    category: "pastries",
    name: "Chocolate Doughnut",
    description: "Soft doughnut with chocolate finish.",
    details:
      "A richer doughnut option for chocolate lovers who want a sweet bakery treat.",
    image: images.doughnut,
    imageAlt: "Chocolate glazed doughnuts",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Doughnut", "Chocolate"],
    ingredients: ["Doughnut dough", "Chocolate finish"],
  },
  {
    id: "milky-doughnut",
    category: "pastries",
    name: "Milky Doughnut",
    description: "Soft doughnut with a creamy milk-style finish.",
    details:
      "A smooth and sweet doughnut for customers who prefer a creamier pastry profile.",
    image: images.doughnut,
    imageAlt: "Creamy glazed doughnuts",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Doughnut", "Creamy"],
    ingredients: ["Doughnut dough", "Milky cream finish"],
  },
  {
    id: "combo-chops",
    category: "chops",
    name: "Combo Chops",
    description: "Spring roll, samosa, and puff puff in one snack combo.",
    details:
      "A compact small-chops mix for customers who want variety in one order.",
    image: images.chops,
    imageAlt: "Small chops with samosa and spring roll",
    prices: [{ amount: "NGN 1,500" }],
    tags: ["Chops", "Combo"],
    ingredients: ["Spring roll", "Samosa", "Puff puff"],
  },
  {
    id: "samosa",
    category: "chops",
    name: "Samosa",
    description: "Crisp triangular small chop with savoury filling.",
    details:
      "A classic party snack and quick bite that pairs well with cold drinks.",
    image: images.chops,
    imageAlt: "Crispy samosa small chops",
    prices: [{ amount: "NGN 350" }],
    tags: ["Chops", "Snack"],
    ingredients: ["Pastry wrap", "Savoury filling"],
  },
  {
    id: "spring-rolls",
    category: "chops",
    name: "Spring Rolls",
    description: "Crisp rolls with seasoned vegetable-style filling.",
    details:
      "A familiar small-chops order for parties, office snacks, and quick sides.",
    image: images.chops,
    imageAlt: "Golden spring rolls on a plate",
    prices: [{ amount: "NGN 400" }],
    tags: ["Chops", "Rolls"],
    ingredients: ["Roll wrapper", "Seasoned filling"],
  },
  {
    id: "puff-puff",
    category: "chops",
    name: "Puff Puff",
    description: "Soft fried dough ball with a lightly sweet bite.",
    details:
      "A simple Nigerian snack for customers who want something warm, soft, and affordable.",
    image: images.chops,
    imageAlt: "Fried small chops served together",
    prices: [{ amount: "NGN 100" }],
    tags: ["Chops", "Snack"],
    ingredients: ["Fried dough", "Light sugar"],
  },
  {
    id: "veggie-pizza",
    category: "pizza",
    name: "Veggie Pizza",
    description: "Sauce, sweet corn, mushroom, onion ring, green pepper, olive seed.",
    details:
      "A vegetable-forward pizza for customers who want colour, crunch, and lighter toppings.",
    image: images.pizza,
    imageAlt: "Vegetable pizza with cheese and toppings",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Sweet corn", "Mushroom", "Onion ring", "Green pepper", "Olive seed"],
  },
  {
    id: "chicken-pizza",
    category: "pizza",
    name: "Chicken Pizza",
    description: "Sauce, chicken, onion ring, and sausage.",
    details:
      "A regular pizza built around chicken and sausage for a familiar crowd-friendly choice.",
    image: images.pizza,
    imageAlt: "Chicken pizza with melted cheese",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Chicken", "Onion ring", "Sausage"],
  },
  {
    id: "beef-pizza",
    category: "pizza",
    name: "Beef Pizza",
    description: "Sauce, beef, onion ring, and sausage.",
    details:
      "A savoury beef pizza for customers who want a meaty regular pizza option.",
    image: images.pizza,
    imageAlt: "Beef pizza with cheese and toppings",
    prices: regularPizzaPrices(),
    tags: ["Pizza", "Regular"],
    ingredients: ["Sauce", "Beef", "Onion ring", "Sausage"],
  },
  {
    id: "pepperoni-pizza",
    category: "pizza",
    name: "Pepperoni Pizza",
    description: "Sauce, cheese, and pepperoni.",
    details:
      "A classic special pizza for customers who want a bold pepperoni topping and melted cheese.",
    image: images.pizza,
    imageAlt: "Pepperoni pizza with melted cheese",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Cheese", "Pepperoni"],
  },
  {
    id: "shrimp-pizza",
    category: "pizza",
    name: "Shrimp Pizza",
    description: "Sauce, shrimp, sweet corn, and cheese.",
    details:
      "A seafood-leaning special pizza with sweet corn and cheese for a richer topping mix.",
    image: images.pizza,
    imageAlt: "Seafood pizza with cheese",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Shrimp", "Sweet corn", "Cheese"],
  },
  {
    id: "super-mix-pizza",
    category: "pizza",
    name: "Super Mix Pizza",
    description: "Chicken, beef, sweet corn, onion ring, and green pepper.",
    details:
      "A loaded special pizza for groups that want both chicken and beef on one order.",
    image: images.pizza,
    imageAlt: "Loaded pizza with mixed toppings",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Chicken", "Beef", "Sweet corn", "Onion ring", "Green pepper"],
  },
  {
    id: "fajita-pizza",
    category: "pizza",
    name: "Fajita Pizza",
    description: "Sauce, chicken, onion ring, and green pepper.",
    details:
      "A chicken special pizza with fajita-style direction and vegetable crunch.",
    image: images.pizza,
    imageAlt: "Chicken fajita pizza with green pepper",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Chicken", "Onion ring", "Green pepper"],
  },
  {
    id: "suya-pizza",
    category: "pizza",
    name: "Suya Pizza",
    description: "Sauce, beef suya, and onion ring.",
    details:
      "A Nigerian-inspired special pizza with beef suya flavour and onion ring topping.",
    image: images.pizza,
    imageAlt: "Pizza with beef toppings and onions",
    prices: specialPizzaPrices(),
    tags: ["Pizza", "Special"],
    ingredients: ["Sauce", "Beef suya", "Onion ring"],
  },
];

const categoryImageIndexes: Partial<Record<CategoryId, number>> = {};

const menuItems = baseMenuItems.map((item) => {
  const imageIndex = categoryImageIndexes[item.category] ?? 0;
  categoryImageIndexes[item.category] = imageIndex + 1;

  return {
    ...item,
    image: getVariedImage(item, imageIndex),
  };
}) satisfies readonly MenuItem[];

const categoryIconMap = {
  cakes: CakeSlice,
  burgers: Utensils,
  sandwiches: Utensils,
  protein: Utensils,
  "ice-cream": IceCreamBowl,
  pastries: Sparkles,
  chops: Utensils,
  pizza: Pizza,
} satisfies Record<CategoryId, typeof CakeSlice>;

function getVariedImage(item: MenuItem, imageIndex: number): string {
  const pool = imagePools[item.category];

  return pool[imageIndex % pool.length] ?? item.image;
}

function formatPriceSummary(item: MenuItem): string {
  if (item.prices.length === 1) return item.prices[0]?.amount ?? "";

  return item.prices
    .map((price) => `${price.label}: ${price.amount}`)
    .join(" / ");
}

function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${sunflourWhatsAppPhone}?text=${encodeURIComponent(message)}`;
}

function getGeneralEnquiryMessage(): string {
  return "Hello Sunflour Bakery, I would like to make an enquiry about your menu.";
}

function getItemEnquiryMessage(item: MenuItem): string {
  return `Hello Sunflour Bakery, I would like to enquire about ${item.name}. Please confirm availability, ordering details, and pickup timing.`;
}

function regularPizzaPrices(): readonly Price[] {
  return [
    { label: "Small", amount: "NGN 5,500" },
    { label: "Medium", amount: "NGN 8,000" },
    { label: "Big", amount: "NGN 12,000" },
    { label: "Family", amount: "NGN 13,500" },
  ];
}

function specialPizzaPrices(): readonly Price[] {
  return [
    { label: "Small", amount: "NGN 7,500" },
    { label: "Medium", amount: "NGN 10,000" },
    { label: "Big", amount: "NGN 14,000" },
    { label: "Family", amount: "NGN 15,500" },
  ];
}

export function SunflourMenuClient() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = menuItems.find((item) => item.id === selectedItemId) ?? null;
  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const categoryFilteredItems =
      activeCategory === "all"
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory);

    if (!normalizedQuery) return categoryFilteredItems;

    return categoryFilteredItems.filter((item) => {
      const categoryLabel =
        categories.find((category) => category.id === item.category)?.label ?? "";
      const searchableText = [
        item.name,
        item.description,
        item.details,
        categoryLabel,
        ...item.tags,
        ...(item.ingredients ?? []),
        ...item.prices.flatMap((price) => [price.label ?? "", price.amount]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fff8ec] text-[#24150d]">
      <CategoryNav
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <Hero onSelectItem={setSelectedItemId} visibleItems={visibleItems} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section aria-labelledby="menu-heading" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b22416]">
                Full Menu
              </p>
              <h2
                id="menu-heading"
                className="mt-2 text-3xl font-black tracking-normal text-[#24150d] sm:text-4xl"
              >
                Fresh bakery, grills, ice cream, and pizza
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#6f4b33]">
              Prices are presented exactly from the current Sunflour menu. Tap
              any item to see its details, ingredients, and serving options.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onSelect={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
          {visibleItems.length === 0 && (
            <div className="rounded-2xl border border-[#eed49b] bg-[#ffffff] px-5 py-8 text-center">
              <p className="text-base font-black text-[#24150d]">
                No menu items found.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6f4b33]">
                Try another product name, category, or ingredient.
              </p>
            </div>
          )}
        </section>
      </main>
      <ContactFooter />
      <WhatsAppFloatingAction />
      <ItemModal item={selectedItem} onClose={() => setSelectedItemId(null)} />
    </div>
  );
}

function Hero({
  onSelectItem,
  visibleItems,
}: {
  readonly onSelectItem: (itemId: string) => void;
  readonly visibleItems: readonly MenuItem[];
}) {
  return (
    <header
      id="top"
      className="relative scroll-mt-24 overflow-hidden border-b border-[#f0d9a8] bg-[#fffdf8]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,102,0.34),transparent_32%),radial-gradient(circle_at_top_right,rgba(178,36,22,0.12),transparent_34%)]"
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-7 px-0 py-7 sm:px-6 sm:py-9 lg:grid-cols-[0.42fr,1fr] lg:px-8 lg:py-10">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="px-4 sm:px-0">
            <h1 className="text-4xl font-black tracking-normal text-[#24150d] sm:text-5xl">
              Our Menu
            </h1>
          </div>
          <p className="mt-4 max-w-xl px-4 text-base leading-7 text-[#6f4b33] sm:px-0 sm:text-lg">
            Fresh menu, clear prices, quick ordering.
          </p>
        </div>
        <MenuPriceTable onSelectItem={onSelectItem} items={visibleItems} />
      </div>
    </header>
  );
}

function MenuPriceTable({
  onSelectItem,
  items,
}: {
  readonly onSelectItem: (itemId: string) => void;
  readonly items: readonly MenuItem[];
}) {
  return (
    <div className="overflow-hidden border-y border-[#eed49b] bg-[#ffffff] shadow-[0_12px_34px_rgba(61,33,12,0.08)] sm:rounded-[1.4rem] sm:border">
      <div className="border-b border-[#f0d9a8] bg-[#fff8ec] px-4 py-3 sm:px-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b22416]">
          Price List
        </p>
        <h2 className="mt-1 text-xl font-black tracking-normal text-[#24150d]">
          Tap any row for details
        </h2>
      </div>
      <div>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Sunflour Bakery menu items and prices
          </caption>
          <thead className="sticky top-0 z-10 bg-[#ffffff]">
            <tr className="border-b border-[#f0d9a8] text-xs uppercase tracking-[0.16em] text-[#8a5b20]">
              <th scope="col" className="px-4 py-3 font-black sm:px-5">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-left font-black sm:px-5">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3e4c3]">
            {items.map((item) => (
              <tr key={item.id} className="transition hover:bg-[#fff6df]">
                <th scope="row" className="p-0 align-middle">
                  <button
                    type="button"
                    onClick={() => onSelectItem(item.id)}
                    className="min-h-14 w-full px-4 py-3 text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#b22416] sm:px-5"
                  >
                    <span className="block truncate text-sm font-black text-[#24150d] sm:text-base">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9a6b24]">
                      {categories.find((category) => category.id === item.category)?.label}
                    </span>
                  </button>
                </th>
                <td className="p-0 text-left align-middle">
                  <button
                    type="button"
                    onClick={() => onSelectItem(item.id)}
                    className="block min-h-14 w-full max-w-[11rem] px-4 py-3 text-left text-[0.7rem] font-black leading-5 text-[#b22416] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#b22416] sm:max-w-sm sm:px-5 sm:text-xs"
                  >
                    {formatPriceSummary(item)}
                    <span className="sr-only"> View {item.name} details</span>
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-8 text-center text-sm font-bold text-[#6f4b33] sm:px-5"
                >
                  No matching menu items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryNav({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: {
  readonly activeCategory: CategoryId | "all";
  readonly onCategoryChange: (category: CategoryId | "all") => void;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
}) {
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-30 border-b border-[#f0d9a8] bg-[#fffdf8]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 sm:gap-3">
        <a
          href="#top"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#f0d9a8] bg-[#fffdf8] px-2 text-sm font-black text-[#24150d] sm:px-3"
          aria-label="Sunflour Bakery Menu top"
        >
          <span className="flex h-8 w-10 items-center justify-center overflow-hidden rounded-full bg-[#ffffff] p-1">
            <Image
              src="/sunflour/sunflour-logo.png"
              alt=""
              width={80}
              height={54}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="hidden sm:inline">Sunflour Bakery</span>
        </a>
        <div className="relative shrink-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b22416]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
            className="h-11 w-36 rounded-full border border-[#e2bd59] bg-[#ffffff] pl-9 pr-4 text-sm font-bold text-[#24150d] outline-none placeholder:text-[#9a6b24] focus:border-[#b22416] focus:ring-3 focus:ring-[#b22416]/20 sm:w-64"
          />
        </div>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          <CategoryButton
            label="All"
            isActive={activeCategory === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              label={category.label}
              isActive={activeCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function CategoryButton({
  label,
  isActive,
  onClick,
}: {
  readonly label: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isActive
          ? "min-h-11 whitespace-nowrap rounded-full bg-[#b22416] px-4 text-sm font-black text-[#fffdf8] shadow-[0_10px_24px_rgba(178,36,22,0.16)]"
          : "min-h-11 whitespace-nowrap rounded-full border border-[#e2bd59] bg-[#ffffff] px-4 text-sm font-bold text-[#5a351f] transition hover:border-[#b22416] hover:text-[#b22416]"
      }
    >
      {label}
    </button>
  );
}

function MenuCard({
  item,
  onSelect,
}: {
  readonly item: MenuItem;
  readonly onSelect: () => void;
}) {
  const category = categories.find((entry) => entry.id === item.category);
  const CategoryIcon = categoryIconMap[item.category];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-[#eed49b] bg-[#ffffff] text-left shadow-[0_18px_45px_rgba(61,33,12,0.08)] transition hover:-translate-y-0.5 hover:border-[#d8ad4c] hover:shadow-[0_22px_55px_rgba(61,33,12,0.13)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#b22416] sm:min-h-[25rem]"
      aria-label={`View ${item.name} details`}
    >
      <span className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          unoptimized
        />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#fffdf8]/95 px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.1em] text-[#b22416] shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs sm:tracking-[0.12em]">
          <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {category?.label}
        </span>
      </span>
      <span className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="text-base font-black tracking-normal text-[#24150d] sm:text-xl">
          {item.name}
        </span>
        <span className="mt-2 line-clamp-3 text-xs leading-5 text-[#6f4b33] sm:text-sm sm:leading-6">
          {item.description}
        </span>
        <span className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e6c779] bg-[#fff9e8] px-2 py-1 text-[0.68rem] font-bold text-[#6f3b00] sm:px-2.5 sm:text-xs"
            >
              {tag}
            </span>
          ))}
        </span>
        <span className="mt-auto pt-5">
          <span className="block text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#b22416] sm:text-xs sm:tracking-[0.16em]">
            From
          </span>
          <span className="mt-1 flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#24150d] sm:text-lg">
              {item.prices[0]?.amount}
            </span>
            <ChevronRight
              className="h-5 w-5 text-[#b22416] transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    </button>
  );
}

function ItemModal({
  item,
  onClose,
}: {
  readonly item: MenuItem | null;
  readonly onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const itemWhatsAppUrl = getWhatsAppUrl(getItemEnquiryMessage(item));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[#eed49b] bg-[#fffdf8] text-[#24150d] shadow-[0_28px_90px_rgba(0,0,0,0.35)]"
      >
        <div className="grid max-h-[92vh] overflow-y-auto md:grid-cols-[0.95fr,1.05fr]">
          <div className="relative aspect-[4/3] min-h-64 md:aspect-auto md:min-h-full">
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              sizes="(min-width: 768px) 46vw, 100vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b22416]">
                  {categories.find((category) => category.id === item.category)?.label}
                </p>
                <h2
                  id="menu-item-title"
                  className="mt-2 text-3xl font-black tracking-normal text-[#24150d]"
                >
                  {item.name}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e2bd59] bg-[#ffffff] text-[#24150d] transition hover:border-[#b22416]"
                aria-label="Close menu item details"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-base leading-7 text-[#6f4b33]">
              {item.details}
            </p>

            <div className="mt-5 rounded-2xl border border-[#eed49b] bg-[#ffffff] p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#b22416]">
                Price
              </h3>
              <div className="mt-3 grid gap-2">
                {item.prices.map((price) => (
                  <div
                    key={`${price.label ?? "default"}-${price.amount}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[#fff8ec] px-3 py-2"
                  >
                    <span className="text-sm font-bold text-[#6f4b33]">
                      {price.label ?? "Order"}
                    </span>
                    <span className="text-sm font-black text-[#24150d]">
                      {price.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {item.ingredients && (
              <div className="mt-5">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#b22416]">
                  Includes
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full border border-[#e6c779] bg-[#fff8ec] px-3 py-1.5 text-sm font-bold text-[#6f3b00]"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={itemWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Message Sunflour Bakery on WhatsApp about ${item.name}`}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#128c4a] px-5 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(18,140,74,0.22)] transition hover:bg-[#0f773f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#25d366]"
            >
              <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactFooter() {
  const whatsAppUrl = getWhatsAppUrl(getGeneralEnquiryMessage());

  return (
    <footer className="border-t border-[#f0d9a8] bg-[#ffffff] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-[1fr,1.2fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#b22416]">
            Sunflour Bakery
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#6f4b33]">
            Made with passion. Served with delight.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-[#24150d] sm:grid-cols-2">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Atekong%20by%20Fiesta%20Fries"
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eed49b] bg-[#fffdf8] px-4 py-3 transition hover:border-[#b22416]"
          >
            <MapPin className="h-5 w-5 shrink-0 text-[#b22416]" aria-hidden="true" />
            <span>Atekong by Fiesta Fries</span>
          </a>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message Sunflour Bakery on WhatsApp"
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eed49b] bg-[#fffdf8] px-4 py-3 transition hover:border-[#b22416]"
          >
            <FaWhatsapp className="h-5 w-5 shrink-0 text-[#128c4a]" aria-hidden="true" />
            <span>WhatsApp: {sunflourDisplayPhone}</span>
          </a>
          <a
            href="https://www.instagram.com/sunflour_bakery_calabar/"
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eed49b] bg-[#fffdf8] px-4 py-3 transition hover:border-[#b22416]"
          >
            <Instagram className="h-5 w-5 shrink-0 text-[#b22416]" aria-hidden="true" />
            <span>@sunflour_bakery_calabar</span>
          </a>
          <a
            href="https://www.tiktok.com/@sunflourbakery7"
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eed49b] bg-[#fffdf8] px-4 py-3 transition hover:border-[#b22416]"
          >
            <Music2 className="h-5 w-5 shrink-0 text-[#b22416]" aria-hidden="true" />
            <span>TikTok: @sunflourbakery7</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFloatingAction() {
  const whatsAppUrl = getWhatsAppUrl(getGeneralEnquiryMessage());

  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Sunflour Bakery on WhatsApp"
      className="fixed bottom-4 right-4 z-40 inline-flex min-h-14 w-14 items-center justify-center rounded-full bg-[#128c4a] text-white shadow-[0_18px_45px_rgba(18,140,74,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0f773f] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#25d366] sm:bottom-6 sm:right-6 sm:w-auto sm:gap-2 sm:px-5"
    >
      <FaWhatsapp className="h-6 w-6" aria-hidden="true" />
      <span className="hidden text-sm font-black sm:inline">WhatsApp</span>
    </a>
  );
}
