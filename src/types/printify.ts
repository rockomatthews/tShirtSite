export type PrintifyBlueprint = {
  id: number;
  title: string;
  description?: string;
};

export type PrintifyProvider = {
  id: number;
  title: string;
  location?: string;
};

export type PrintifyVariant = {
  id: number;
  title: string;
  options?: Record<string, any>;
};


