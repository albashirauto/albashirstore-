/** The four parts pages: /parts/motorcycle, /parts/cycle, /parts/rickshaw, /parts/loader */
export const VEHICLE_TYPES = [
  { type: "motorcycle", title: "Motorcycle parts", short: "Motorcycle", sub: "Parts for Honda CD 70, CG 125, CB 150F, Yamaha, Suzuki and more." },
  { type: "rickshaw", title: "Rickshaw parts", short: "Rickshaw", sub: "Engine, brake, clutch and body parts for auto rickshaws." },
  { type: "loader", title: "Loader parts", short: "Loader", sub: "Heavy duty parts for loader rickshaws that work all day." },
  { type: "cycle", title: "Cycle parts", short: "Cycle", sub: "Chains, brakes, tyres and spares for bicycles." },
] as const;
export const vehicleType = (t: string) => VEHICLE_TYPES.find((v) => v.type === t);
