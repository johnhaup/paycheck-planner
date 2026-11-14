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
 */
public class LayoutDirectionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LayoutDirection")

    AsyncFunction("setRTL") { (rtl: Bool) in
      guard #available(iOS 17.0, *) else { return }
      for scene in UIApplication.shared.connectedScenes {
        (scene as? UIWindowScene)?.traitOverrides.layoutDirection = rtl ? .rightToLeft : .leftToRight
      }
    }.runOnQueue(.main)
  }
}
