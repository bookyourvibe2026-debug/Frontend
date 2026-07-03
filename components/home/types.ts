export type Role = "player" | "owner" | "food";

export type Sport = {
  id: string;
  label: string;
  image: string;
  alt: string;
  isNew?: boolean;
  bubble: string;
};

export type AuthMode = "login" | "signup" | "admin" | null;

export type FooterLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};
