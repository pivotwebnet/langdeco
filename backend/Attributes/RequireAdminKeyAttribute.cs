using Microsoft.AspNetCore.Mvc;
using backend.Filters;

namespace backend.Attributes;

public class RequireAdminKeyAttribute : ServiceFilterAttribute
{
    public RequireAdminKeyAttribute() : base(typeof(RequireAdminKeyFilter)) { }
}
