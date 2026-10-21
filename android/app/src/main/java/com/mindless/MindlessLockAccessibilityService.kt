package com.mindless

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class MindlessLockAccessibilityService : AccessibilityService() {
  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }

  companion object {
    @Volatile
    var instance: MindlessLockAccessibilityService? = null
      private set
  }
}
