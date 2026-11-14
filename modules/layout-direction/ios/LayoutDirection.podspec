Pod::Spec.new do |s|
  s.name           = 'LayoutDirection'
  s.version        = '1.0.0'
  s.summary        = 'Sets UIKit layout direction to the in-app language direction'
  s.description    = 'Overrides the layout direction trait of the app scenes so native chrome follows React Native'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
