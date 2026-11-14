import ExpoModulesCore
import UIKit

/**
 UIKit takes its layout direction from the app's iOS language. The in-app
 language can differ from it, and React Native then lays out its own views the
 other way round, so the navigation bars ended up mirrored against the content
 (HAU-171). react-native-screens forces
 `semanticContentAttribute` on the navigation bar, which the iOS 26+ bar does
 not follow; it reads the layout direction trait. Overriding the trait on the
 scene reaches every window in it.

 The back button's chevron needs two more things (HAU-325):
 - react-native-screens forces RTL on everything inside its navigation bar
   through appearance proxies and never takes that back for LTR, so after a
   reload from RTL to LTR the stale proxies squeezed the chevron to zero width.
 - UIKit picks the chevron's glyph by the app's iOS language, whatever the
   trait says: an Arabic device draws "› Back" in a left-to-right bar. Nothing
   public changes that, so `nativeRTL` tells JS when to pass its own icon
   (`src/constants/backIcon.ts`).
 */
public class LayoutDirectionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LayoutDirection")

    Constants([
      "nativeRTL": Locale.characterDirection(forLanguage: Bundle.main.preferredLocalizations.first ?? "en") == .rightToLeft
    ])

    AsyncFunction("setRTL") { (rtl: Bool) in
      guard #available(iOS 17.0, *) else { return }
      for scene in UIApplication.shared.connectedScenes {
        (scene as? UIWindowScene)?.traitOverrides.layoutDirection = rtl ? .rightToLeft : .leftToRight
      }
      if let bar = NSClassFromString("RNSNavigationBar") as? UIAppearanceContainer.Type {
        let attribute: UISemanticContentAttribute = rtl ? .forceRightToLeft : .unspecified
        UIButton.appearance(whenContainedInInstancesOf: [bar]).semanticContentAttribute = attribute
        UIView.appearance(whenContainedInInstancesOf: [bar]).semanticContentAttribute = attribute
        UISearchBar.appearance(whenContainedInInstancesOf: [bar]).semanticContentAttribute = attribute
      }
    }.runOnQueue(.main)
  }
}
