// src/config/crops.ts

// --- WEEK 1: TURNIPS ---
import turnip1 from "../assets/crops/turnip/tile000.png";
import turnip2 from "../assets/crops/turnip/tile001.png";
import turnip3 from "../assets/crops/turnip/tile002.png";
import turnip4 from "../assets/crops/turnip/tile003.png";
import turnip5 from "../assets/crops/turnip/tile004.png";
import turnip6 from "../assets/crops/turnip/tile005.png";
import turnip7 from "../assets/crops/turnip/tile006.png"; 

// --- WEEK 2: PUMPKINS ---
import pumpkin1 from "../assets/crops/squash/tile000.png";
import pumpkin2 from "../assets/crops/squash/tile001.png";
import pumpkin3 from "../assets/crops/squash/tile002.png";
import pumpkin4 from "../assets/crops/squash/tile003.png";
import pumpkin5 from "../assets/crops/squash/tile004.png";
import pumpkin6 from "../assets/crops/squash/tile005.png";
import pumpkin7 from "../assets/crops/squash/tile006.png";

import cauliflower1 from "../assets/crops/cauliflower/tile000.png";
import cauliflower2 from "../assets/crops/cauliflower/tile001.png";
import cauliflower3 from "../assets/crops/cauliflower/tile002.png";
import cauliflower4 from "../assets/crops/cauliflower/tile003.png";
import cauliflower5 from "../assets/crops/cauliflower/tile004.png";
import cauliflower6 from "../assets/crops/cauliflower/tile005.png";
import cauliflower7 from "../assets/crops/cauliflower/tile006.png";

export interface CropConfig {
  name: string;
  stages: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CROP_ROTATION: CropConfig[] = [
  {
    name: "Turnip",
    stages: [turnip1, turnip2, turnip3, turnip4, turnip5, turnip6, turnip7],
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  {
    name: "Pumpkin",
    stages: [pumpkin1, pumpkin2, pumpkin3, pumpkin4, pumpkin5, pumpkin6, pumpkin7],
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    name: "Cauliflower",
    stages: [cauliflower1, cauliflower2, cauliflower3, cauliflower4, cauliflower5, cauliflower6, cauliflower7],
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
];