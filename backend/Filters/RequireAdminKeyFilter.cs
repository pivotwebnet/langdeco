using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Filters;

public class RequireAdminKeyFilter : IAsyncActionFilter
{
    private readonly IConfiguration _config;

    public RequireAdminKeyFilter(IConfiguration config) => _config = config;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var configuredKey = _config["AdminApiKey"];
        if (!string.IsNullOrEmpty(configuredKey))
        {
            var provided = context.HttpContext.Request.Headers["X-Admin-Key"].ToString();
            if (provided != configuredKey)
            {
                context.Result = new UnauthorizedObjectResult(new { error = "Invalid or missing X-Admin-Key" });
                return;
            }
        }

        await next();
    }
}
