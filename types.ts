// types.ts
export type Character = {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: string;
  image: string;
};

export type Episode = {
  id: number;
  name: string;
  air_date: string;
  episode: number;
  season: number;
};

export type Location = {
  id: number;
  name: string;
  type: string;
  dimension: string;
};
