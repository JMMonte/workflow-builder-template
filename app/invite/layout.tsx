import type { ReactNode } from "react";

type InviteLayoutProps = {
  children: ReactNode;
};

const InviteLayout = ({ children }: InviteLayoutProps) => (
  <div className="pointer-events-auto relative z-10">{children}</div>
);

export default InviteLayout;
