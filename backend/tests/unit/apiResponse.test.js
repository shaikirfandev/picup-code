/**
 * Unit Tests — ApiResponse Utility
 *
 * Tests all static methods and helper functions.
 */
const { ApiResponse, paginate, getPaginationMeta } = require('../../src/utils/apiResponse');

// Mock Express response
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ApiResponse', () => {
  describe('success()', () => {
    it('should return 200 with success response', () => {
      const res = mockRes();
      ApiResponse.success(res, { foo: 'bar' }, 'OK');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: { foo: 'bar' },
      });
    });

    it('should use default message "Success"', () => {
      const res = mockRes();
      ApiResponse.success(res, null);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null,
      });
    });

    it('should allow custom status code', () => {
      const res = mockRes();
      ApiResponse.success(res, {}, 'OK', 202);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('created()', () => {
    it('should return 201 with created response', () => {
      const res = mockRes();
      ApiResponse.created(res, { id: '123' }, 'Item created');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item created',
        data: { id: '123' },
      });
    });

    it('should use default message "Created successfully"', () => {
      const res = mockRes();
      ApiResponse.created(res, null);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Created successfully' })
      );
    });
  });

  describe('paginated()', () => {
    it('should return 200 with data and pagination meta', () => {
      const res = mockRes();
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, total: 50, totalPages: 5 };

      ApiResponse.paginated(res, data, pagination);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        pagination,
      });
    });
  });

  describe('error()', () => {
    it('should return 500 with error response by default', () => {
      const res = mockRes();
      ApiResponse.error(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
      });
    });

    it('should accept custom message and status code', () => {
      const res = mockRes();
      ApiResponse.error(res, 'Bad input', 400);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad input',
      });
    });
  });

  describe('notFound()', () => {
    it('should return 404', () => {
      const res = mockRes();
      ApiResponse.notFound(res, 'Post not found');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Post not found',
      });
    });

    it('should use default message "Resource not found"', () => {
      const res = mockRes();
      ApiResponse.notFound(res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Resource not found' })
      );
    });
  });

  describe('unauthorized()', () => {
    it('should return 401', () => {
      const res = mockRes();
      ApiResponse.unauthorized(res, 'Token expired');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
      });
    });
  });

  describe('forbidden()', () => {
    it('should return 403', () => {
      const res = mockRes();
      ApiResponse.forbidden(res, 'Admin only');

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin only',
      });
    });
  });
});

describe('paginate()', () => {
  it('should calculate skip and limit for page 1', () => {
    const result = paginate(null, 1, 20);
    expect(result).toEqual({ skip: 0, limit: 20, page: 1 });
  });

  it('should calculate skip for page 3 with limit 10', () => {
    const result = paginate(null, 3, 10);
    expect(result).toEqual({ skip: 20, limit: 10, page: 3 });
  });

  it('should parse string page/limit', () => {
    const result = paginate(null, '2', '15');
    expect(result).toEqual({ skip: 15, limit: 15, page: 2 });
  });

  it('should default to page 1 and limit 20', () => {
    const result = paginate(null);
    expect(result).toEqual({ skip: 0, limit: 20, page: 1 });
  });
});

describe('getPaginationMeta()', () => {
  it('should calculate correct pagination metadata', () => {
    const meta = getPaginationMeta(100, 2, 10);
    expect(meta).toEqual({
      total: 100,
      page: 2,
      limit: 10,
      totalPages: 10,
      hasMore: true,
    });
  });

  it('should return hasMore=false on last page', () => {
    const meta = getPaginationMeta(30, 3, 10);
    expect(meta.hasMore).toBe(false);
    expect(meta.totalPages).toBe(3);
  });

  it('should handle zero total', () => {
    const meta = getPaginationMeta(0, 1, 20);
    expect(meta).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false,
    });
  });

  it('should handle single-page result', () => {
    const meta = getPaginationMeta(5, 1, 20);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasMore).toBe(false);
  });
});
