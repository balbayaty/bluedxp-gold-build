/**
 * ASN List Component
 * Displays a list of ASNs with filtering and sorting
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ASN, ASNStatus, ASNListResponse } from "@/types/asn";
import {
  RiSearchLine,
  RiFilterLine,
  RiArrowRightLine,
  RiFileList3Line,
} from "react-icons/ri";
import Link from "next/link";

interface AsnListProps {
  initialData?: ASNListResponse;
  onAsnClick?: (asn: ASN) => void;
}

export function AsnList({ initialData, onAsnClick }: AsnListProps) {
  const [data, setData] = useState<ASNListResponse | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!initialData) {
      loadAsns();
    }
  }, [page, statusFilter, search]);

  const loadAsns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/asn?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load ASNs");
      }

      const asnData = await response.json();
      setData(asnData);
    } catch (error: any) {
      console.error("Error loading ASNs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  const getStatusColor = (status: ASNStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "exception":
        return "bg-red-100 text-red-800";
      case "receiving":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !data) {
    return <div className="text-center py-8">Loading ASNs...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No ASNs found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ASNs..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <RiFilterLine className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="receiving">Receiving</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ASN List */}
      <div className="space-y-2">
        {data.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RiFileList3Line className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No ASNs found</p>
            </CardContent>
          </Card>
        ) : (
          data.data.map((asn) => (
            <AsnListItem
              key={asn.id}
              asn={asn}
              onClick={() => onAsnClick?.(asn)}
              statusColor={getStatusColor(asn.status)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(page * data.pagination.limit, data.pagination.total)} of{" "}
            {data.pagination.total} ASNs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AsnListItem({
  asn,
  onClick,
  statusColor,
}: {
  asn: ASN;
  onClick: () => void;
  statusColor: string;
}) {
  return (
    <Link href={`/asn/processing/${asn.id}`}>
      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={onClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{asn.asnNumber}</h3>
                <Badge className={statusColor}>
                  {asn.status.replace("_", " ")}
                </Badge>
                {asn.priority === "urgent" && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{asn.supplierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-medium">{asn.totalItems}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: asn.currency || "SAR",
                      minimumFractionDigits: 0,
                    }).format(asn.totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected</p>
                  <p className="font-medium">
                    {asn.expectedArrivalDate
                      ? new Date(asn.expectedArrivalDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {asn.exceptions.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <RiFileList3Line className="h-4 w-4" />
                  <span>{asn.exceptions.length} exception(s)</span>
                </div>
              )}
            </div>

            <RiArrowRightLine className="h-5 w-5 text-muted-foreground ml-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
