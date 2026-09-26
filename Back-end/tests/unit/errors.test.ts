import {
  AppError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessRuleViolationError,
  DependencyUnavailableError,
  ErrorCodes,
} from '../../src/common/errors';

describe('Error Hierarchy & Error Codes', () => {
  it('instantiates base AppError with custom properties', () => {
    const error = new AppError('CUSTOM_CODE', 'Custom error message', 418, { foo: 'bar' }, true);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.message).toBe('Custom error message');
    expect(error.status).toBe(418);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.retryable).toBe(true);
  });

  it('instantiates ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid request payload', [{ field: 'email', issue: 'invalid' }]);

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid request payload');
    expect(error.details).toBeDefined();
  });

  it('instantiates BadRequestError with 400 status', () => {
    const error = new BadRequestError('Malformed query');

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
    expect(error.message).toBe('Malformed query');
  });

  it('instantiates UnauthorizedError with 401 status', () => {
    const error = new UnauthorizedError();

    expect(error.status).toBe(401);
    expect(error.code).toBe(ErrorCodes.AUTH_REQUIRED);
    expect(error.message).toBe('Authentication required');
  });

  it('instantiates ForbiddenError with 403 status', () => {
    const error = new ForbiddenError();

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCodes.FORBIDDEN);
    expect(error.message).toBe('Permission or ownership denied');
  });

  it('instantiates NotFoundError with 404 status', () => {
    const error = new NotFoundError('Book item not found');

    expect(error.status).toBe(404);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.message).toBe('Book item not found');
  });

  it('instantiates ConflictError with 409 status', () => {
    const error = new ConflictError(ErrorCodes.RESOURCE_CONFLICT, 'Item conflict exists');

    expect(error.status).toBe(409);
    expect(error.code).toBe(ErrorCodes.RESOURCE_CONFLICT);
    expect(error.message).toBe('Item conflict exists');
  });

  it('instantiates BusinessRuleViolationError with 422 status', () => {
    const error = new BusinessRuleViolationError(
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Service cannot be added to product cart',
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe(ErrorCodes.BUSINESS_RULE_VIOLATION);
  });

  it('instantiates DependencyUnavailableError with 503 status and retryable flag', () => {
    const error = new DependencyUnavailableError('Database is unreachable');

    expect(error.status).toBe(503);
    expect(error.code).toBe(ErrorCodes.DEPENDENCY_UNAVAILABLE);
    expect(error.retryable).toBe(true);
  });
});
