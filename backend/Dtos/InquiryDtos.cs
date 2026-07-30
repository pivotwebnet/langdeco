using backend.Models;

namespace backend.Dtos;

public record InquiryCreateDto(string ClientName, string Email, string Message);
public record InquiryStatusUpdateDto(InquiryStatus Status);
public record InquiryDto(int Id, string ClientName, string Email, string Message, InquiryStatus Status, DateTime CreatedAt);
