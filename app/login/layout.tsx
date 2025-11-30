import type { ReactNode } from "react";

type LoginLayoutProps = {
  children: ReactNode;
};

const LoginLayout = ({ children }: LoginLayoutProps) => (
  <div className="pointer-events-auto relative z-10">{children}</div>
);

export default LoginLayout;
