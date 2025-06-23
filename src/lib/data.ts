export const projects = [
  {
    id: 1,
    name: "Metropolis Tower",
    clientName: "Stark Industries",
    status: "In Progress",
    dueDate: "2024-08-15",
    analyst: "Alice Johnson",
    analystAvatar: "https://i.pravatar.cc/150?u=alice",
  },
  {
    id: 2,
    name: "Gotham Plaza",
    clientName: "Wayne Enterprises",
    status: "Completed",
    dueDate: "2024-07-20",
    analyst: "Bob Williams",
    analystAvatar: "https://i.pravatar.cc/150?u=bob",
  },
  {
    id: 3,
    name: "Evergreen Terrace",
    clientName: "Springfield Power Plant",
    status: "Initiation",
    dueDate: "2024-09-01",
    analyst: "Charlie Brown",
    analystAvatar: "https://i.pravatar.cc/150?u=charlie",
  },
  {
    id: 4,
    name: "Ocean View Lofts",
    clientName: "Aperture Science",
    status: "In Progress",
    dueDate: "2024-08-25",
    analyst: "Dana Scully",
    analystAvatar: "https://i.pravatar.cc/150?u=dana",
  },
  {
    id: 5,
    name: "Riverside Industrial",
    clientName: "Black Mesa",
    status: "Completed",
    dueDate: "2024-07-30",
    analyst: "Eve Polastri",
    analystAvatar: "https://i.pravatar.cc/150?u=eve",
  },
  {
    id: 6,
    name: "Central Perk Building",
    clientName: "Geller Holdings",
    status: "In Progress",
    dueDate: "2024-09-10",
    analyst: "Frank Reynolds",
    analystAvatar: "https://i.pravatar.cc/150?u=frank",
  },
];

export type Project = (typeof projects)[number];

export const capRateData = [
  { type: "Retail", rate: 6.5 },
  { type: "Office", rate: 5.8 },
  { type: "Industrial", rate: 5.2 },
  { type: "Multifamily", rate: 4.9 },
  { type: "Hospitality", rate: 7.1 },
];

export type CapRate = (typeof capRateData)[number];
