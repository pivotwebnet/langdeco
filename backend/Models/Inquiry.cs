namespace backend.Models;

public enum InquiryStatus { Pending, Replied, Closed }

public class Inquiry
{
    public int Id { get; set; }
    public string ClientName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Message { get; set; } = "";
    public InquiryStatus Status { get; set; } = InquiryStatus.Pending;
    public DateTime CreatedAt { get; set; }
}
