using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using backend.Services;

namespace backend.Filters;

public class RequireAdminKeyFilter : IAsyncActionFilter
{
    private readonly IConfiguration _config;

    public RequireAdminKeyFilter(IConfiguration config) => _config = config;

    // Falla CERRADO: si AdminApiKey no está configurada, ninguna request pasa.
    // Antes, una AdminApiKey vacía dejaba todo el panel admin sin autenticación.
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var configuredKey = _config["AdminApiKey"];
        var provided = context.HttpContext.Request.Headers["X-Admin-Key"].ToString();

        if (!AdminKeyComparer.Matches(provided, configuredKey))
        {
            context.Result = new UnauthorizedObjectResult(new { error = "Invalid or missing X-Admin-Key" });
            return;
        }

        await next();
    }
}
