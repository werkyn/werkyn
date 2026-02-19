import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinWorkspaceForm() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = input.trim();
    if (!trimmed) return;

    // Extract token from invite URL or use raw string
    const match = trimmed.match(/\/invite\/([^/?#]+)/);
    const token = match ? match[1] : trimmed;

    if (!token) {
      setError("Please enter a valid invite link or token");
      return;
    }

    // Navigate to the invite accept page
    navigate({ to: "/invite/$token", params: { token } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-token">Invite link or token</Label>
        <Input
          id="invite-token"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder="https://... or paste token"
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <Button type="submit" variant="outline" className="w-full" disabled={!input.trim()}>
        Join workspace
      </Button>
    </form>
  );
}
