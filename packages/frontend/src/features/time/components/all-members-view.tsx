import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { TimeEntry } from "../api";

interface AllMembersViewProps {
  workspaceId: string;
  entries: TimeEntry[];
  onSelectUser: (userId: string) => void;
}

interface MemberRow {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  hours: number;
}

const columnHelper = createColumnHelper<MemberRow>();

export function AllMembersView({
  workspaceId,
  entries,
  onSelectUser,
}: AllMembersViewProps) {
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const members = membersData?.data ?? [];

  const userHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      map.set(entry.userId, (map.get(entry.userId) ?? 0) + entry.hours);
    }
    return map;
  }, [entries]);

  const data: MemberRow[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        hours: userHours.get(m.user.id) ?? 0,
      })),
    [members, userHours],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("displayName", {
        header: "Member",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserAvatar
              displayName={row.original.displayName}
              avatarUrl={row.original.avatarUrl}
              size="sm"
            />
            <span className="text-sm font-medium">
              {row.original.displayName}
            </span>
          </div>
        ),
        size: 280,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {getValue()}
          </span>
        ),
        size: 120,
      }),
      columnHelper.accessor("hours", {
        header: "Hours This Week",
        cell: ({ getValue }) => {
          const h = getValue();
          return (
            <span className="text-sm font-semibold">
              {h > 0 ? h.toFixed(h % 1 === 0 ? 0 : 2) : "0"}h
            </span>
          );
        },
        size: 140,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const headerGroups = table.getHeaderGroups();

  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background border-b">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground",
                    header.id === "hours" && "text-right",
                    i < headerGroup.headers.length - 1 &&
                      "border-r border-border",
                  )}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => onSelectUser(row.original.userId)}
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  key={cell.id}
                  className={cn(
                    "px-3 py-1.5",
                    cell.column.id === "hours" && "text-right",
                    i < row.getVisibleCells().length - 1 &&
                      "border-r border-border",
                  )}
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                No members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
