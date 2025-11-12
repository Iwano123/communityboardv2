using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OrchardCore.Environment.Shell;
using OrchardCore.Environment.Shell.Scope;
using System.Threading;
using System.Threading.Tasks;

namespace CommunityBoard.Cms.Services;

public class FeatureActivationService : IHostedService
{
    private readonly ILogger<FeatureActivationService> _logger;
    private readonly IShellHost _shellHost;

    public FeatureActivationService(
        ILogger<FeatureActivationService> logger,
        IShellHost shellHost)
    {
        _logger = logger;
        _shellHost = shellHost;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("FeatureActivationService: Starting feature activation...");

        var shell = await _shellHost.GetOrCreateShellContextAsync(
            new ShellSettings { Name = "Default" });

        if (shell == null)
        {
            _logger.LogWarning("FeatureActivationService: Could not get shell context");
            return;
        }

        await ShellScope.UsingAsync(shell.ShellContext, async scope =>
        {
            try
            {
                // Features borde redan vara aktiverade via appsettings.json
                // Men vi loggar för att se vad som händer
                _logger.LogInformation("FeatureActivationService: Shell context loaded");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FeatureActivationService: Error activating features");
            }
        });
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}

