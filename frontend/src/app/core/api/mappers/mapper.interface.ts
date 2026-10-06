/**
 * Core interface for pure unidirectional mapping from backend DTO to domain model.
 */
export interface Mapper<TDto, TDomain> {
  toDomain(dto: TDto): TDomain;
}
