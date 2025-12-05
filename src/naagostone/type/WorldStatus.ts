export interface World {
  world: string;
  status: string;
  category: string;
  canCreateNewCharacter: boolean;
}

export interface LogicalDataCenter {
  logicalDataCenter: string;
  worlds: World[];
}

export interface PhysicalDataCenter {
  physicalDataCenter: string;
  logicalDataCenters: LogicalDataCenter[];
}

export interface WorldStatusResponse {
  worldStatus: PhysicalDataCenter[];
}
