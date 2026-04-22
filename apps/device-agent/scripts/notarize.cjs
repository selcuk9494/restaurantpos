const { notarize } = require('@electron/notarize')

exports.default = async function notarizeApp(context) {
  const { electronPlatformName, appOutDir, packager } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    console.log('[notarize] Apple notarization secrets are missing, skipping notarization.')
    return
  }

  const appName = packager.appInfo.productFilename
  console.log(`[notarize] Starting notarization for ${appName}.app`)

  await notarize({
    tool: 'notarytool',
    appBundleId: packager.appInfo.id,
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId,
  })

  console.log(`[notarize] Completed notarization for ${appName}.app`)
}
