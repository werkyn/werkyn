import { Button } from "@/components/ui/button";

interface SsoConnectorInfo {
  connectorId: string;
  name: string;
  type: string;
}

interface SsoButtonsProps {
  connectors: SsoConnectorInfo[];
  returnUrl?: string;
}

const CONNECTOR_ICONS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
  microsoft: "Microsoft",
  oidc: "SSO",
  saml: "SAML",
  ldap: "LDAP",
};

export function SsoButtons({ connectors, returnUrl }: SsoButtonsProps) {
  const handleSsoLogin = (connectorId: string) => {
    const params = new URLSearchParams();
    params.set("connector_id", connectorId);
    if (returnUrl) {
      params.set("return_url", returnUrl);
    }
    window.location.href = `/api/auth/oidc/login?${params.toString()}`;
  };

  return (
    <div className="space-y-2">
      {connectors.map((connector) => (
        <Button
          key={connector.connectorId}
          variant="outline"
          className="w-full"
          onClick={() => handleSsoLogin(connector.connectorId)}
        >
          Sign in with {connector.name || CONNECTOR_ICONS[connector.type] || connector.type}
        </Button>
      ))}
    </div>
  );
}
