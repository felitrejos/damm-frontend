"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFilter,
  IconPlus,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;

  /** Search input wired to a single column's filter. Pass `undefined` to omit. */
  searchColumnId?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;

  /** Multi-select facet filter on a single column. Pass `undefined` to omit. */
  filterColumnId?: string;
  filterLabel?: string;
  filterMobileLabel?: string;

  /** Primary toolbar action ("Add X"). Pass `undefined` to omit. */
  addButtonLabel?: string;
  onAdd?: () => void;

  /** Row interaction. */
  selectedRowId?: string | null;
  onRowClick?: (row: T) => void;

  initialPageSize?: number;
};

export function DataTable<T>({
  data: initialData,
  columns,
  getRowId,
  searchColumnId,
  searchPlaceholder = "Search...",
  searchAriaLabel = "Search",
  filterColumnId,
  filterLabel = "Filter",
  filterMobileLabel = "Filter",
  addButtonLabel,
  onAdd,
  selectedRowId,
  onRowClick,
  initialPageSize = 10,
}: Props<T>) {
  const [data] = React.useState(() => initialData);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filterColumn = filterColumnId ? table.getColumn(filterColumnId) : null;

  const uniqueFilterValues = React.useMemo(() => {
    if (!filterColumn) return [];
    const facets = filterColumn.getFacetedUniqueValues();
    return Array.from(facets.keys())
      .filter((v): v is string => typeof v === "string")
      .sort();
  }, [filterColumn]);

  const selectedFilterValues =
    (filterColumn?.getFilterValue() as string[] | undefined) ?? [];

  const toggleFilterValue = (value: string, checked: boolean) => {
    if (!filterColumn) return;
    const next = checked
      ? [...selectedFilterValues, value]
      : selectedFilterValues.filter((v) => v !== value);
    filterColumn.setFilterValue(next.length ? next : undefined);
  };

  const showToolbar = !!(searchColumnId || filterColumnId || addButtonLabel);

  return (
    <div className="flex flex-col gap-4">
      {showToolbar ? (
        <div className="flex items-center justify-between gap-4">
          {searchColumnId ? (
            <div className="flex flex-1 items-center gap-2">
              <Label htmlFor="data-table-search" className="sr-only">
                {searchAriaLabel}
              </Label>
              <Input
                id="data-table-search"
                placeholder={searchPlaceholder}
                value={
                  (table
                    .getColumn(searchColumnId)
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn(searchColumnId)
                    ?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2">
            {filterColumnId && uniqueFilterValues.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <IconFilter />
                  <span className="hidden lg:inline">{filterLabel}</span>
                  <span className="lg:hidden">{filterMobileLabel}</span>
                  {selectedFilterValues.length > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                      {selectedFilterValues.length}
                    </span>
                  ) : null}
                  <IconChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {uniqueFilterValues.map((value) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={selectedFilterValues.includes(value)}
                      onCheckedChange={(checked) =>
                        toggleFilterValue(value, !!checked)
                      }
                    >
                      {value}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {addButtonLabel ? (
              <Button variant="outline" size="sm" onClick={onAdd}>
                <IconPlus />
                <span className="hidden lg:inline">{addButtonLabel}</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-4"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.id === selectedRowId ? "selected" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="flex w-full items-center gap-8 lg:w-fit lg:ml-auto">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">First page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
