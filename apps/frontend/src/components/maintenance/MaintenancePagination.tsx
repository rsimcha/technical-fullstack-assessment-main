import React from 'react';

interface MaintenancePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (nextPage: number) => void;
}

const MaintenancePagination: React.FC<MaintenancePaginationProps> = ({
  page,
  totalPages,
  total,
  onChange,
}) => {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {page} of {safeTotalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-outline btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn-outline btn-sm"
          disabled={page >= safeTotalPages}
          onClick={() => onChange(Math.min(safeTotalPages, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MaintenancePagination;
