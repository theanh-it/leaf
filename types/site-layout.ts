export interface SiteLayoutLink {
  readonly label: string;
  readonly url: string;
}

export interface SiteLayout {
  readonly header: {
    readonly logo: string | null;
    readonly links: readonly SiteLayoutLink[];
  };
  readonly footer: {
    readonly address: string | null;
    readonly links: readonly SiteLayoutLink[];
  };
}
