import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, LogIn, ShieldAlert, UserX } from "lucide-react";

type StatusFilter = "all" | "pending" | "confirmed" | "unsubscribed" | "sendable";

const PAGE_SIZE = 50;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
}

export default function AdminNewsletterPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const listInput = useMemo(
    () => ({
      status:
        statusFilter === "all" || statusFilter === "sendable"
          ? undefined
          : (statusFilter as "pending" | "confirmed" | "unsubscribed"),
      sendable: statusFilter === "sendable" ? true : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [statusFilter, page]
  );

  const isAdmin = user?.role === "admin";
  const enabled = isAuthenticated && isAdmin;

  const { data, isLoading, isFetching, error, refetch } = trpc.newsletter.list.useQuery(
    listInput,
    { enabled, retry: false }
  );

  const utils = trpc.useUtils();
  const unsubscribeMutation = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: async () => {
      setActionMsg("Marked as unsubscribed.");
      await utils.newsletter.list.invalidate();
    },
    onError: (err) => {
      setActionMsg(err.message || "Unsubscribe failed.");
    },
  });

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setActionMsg(null);
    try {
      const result = await utils.newsletter.exportCsv.fetch({
        status:
          statusFilter === "all" || statusFilter === "sendable"
            ? undefined
            : (statusFilter as "pending" | "confirmed" | "unsubscribed"),
        sendable: statusFilter === "sendable" ? true : undefined,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActionMsg("CSV downloaded.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "CSV export failed.";
      setActionMsg(message);
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#FF1493]" size={32} />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <ShieldAlert className="mx-auto mb-4 text-[#FF1493]" size={40} />
          <h1 className="font-display text-3xl mb-2">Admin only</h1>
          <p className="text-[#666] mb-6">Sign in with an admin account to view newsletter subscribers.</p>
          <Button asChild className="bg-[#FF1493] hover:bg-[#FF1493]/90">
            <a href={getLoginUrl("/admin/newsletter")}>
              <LogIn size={16} className="mr-2" /> Sign in
            </a>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <ShieldAlert className="mx-auto mb-4 text-[#FF1493]" size={40} />
          <h1 className="font-display text-3xl mb-2">403 — Forbidden</h1>
          <p className="text-[#666] mb-6">This page is restricted to admins.</p>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#FF1493] mb-1">
              Admin CRM
            </p>
            <h1 className="font-display text-3xl text-[#1a1a1a]">Newsletter subscribers</h1>
            <p className="text-sm text-[#666] mt-1">
              Read-only list with optional pending → unsubscribed. No email send.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-[#00BFFF] hover:underline">
            ← Dashboard
          </Link>
        </div>

        <Card className="border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-lg">
              {isLoading ? "Loading…" : `${total} subscriber${total === 1 ? "" : "s"}`}
              {isFetching && !isLoading ? (
                <Loader2 className="inline ml-2 animate-spin" size={14} />
              ) : null}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter);
                  setPage(0);
                  setActionMsg(null);
                }}
              >
                <SelectTrigger className="w-[180px] border-[#1a1a1a]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="sendable">Sendable</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-[#1a1a1a]"
                onClick={handleExport}
                disabled={exporting || total === 0}
              >
                {exporting ? (
                  <Loader2 className="animate-spin mr-2" size={14} />
                ) : (
                  <Download className="mr-2" size={14} />
                )}
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {actionMsg && (
              <p className="mb-3 text-sm rounded-md bg-[#F0F8FF] border border-[#00BFFF] px-3 py-2">
                {actionMsg}
              </p>
            )}
            {error && (
              <p className="mb-3 text-sm text-red-600">
                Failed to load: {error.message}
              </p>
            )}

            <div className="rounded-md border border-[#1a1a1a] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FFF5F9]">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Country</TableHead>
                    <TableHead className="font-bold">Locale</TableHead>
                    <TableHead className="font-bold">Source path</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Consent</TableHead>
                    <TableHead className="font-bold">Created at</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-[#666]">
                        Loading subscribers…
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-[#666]">
                        No subscribers for this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell className="font-medium">{row.email}</TableCell>
                        <TableCell>{row.country || "—"}</TableCell>
                        <TableCell>{row.locale}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-[#555]" title={row.sourcePath}>
                          {row.sourcePath}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              row.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : row.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                            }`}
                          >
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.marketingConsent ? "yes" : "no"}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#1a1a1a] text-xs"
                              disabled={unsubscribeMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Mark ${row.email} as unsubscribed? (pending → unsubscribed only)`
                                  )
                                ) {
                                  setActionMsg(null);
                                  unsubscribeMutation.mutate({ id: row.id });
                                }
                              }}
                            >
                              <UserX size={12} className="mr-1" />
                              Unsubscribe
                            </Button>
                          ) : (
                            <span className="text-xs text-[#aaa]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
              <p className="text-xs text-[#666]">
                Page {page + 1} of {totalPages} · showing up to {PAGE_SIZE} per page (max export 200)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
