## Intersection Observer API Resources and Patch Guide for UNA CMS Timeline 14.0.10

The Intersection Observer API is a powerful tool for detecting when elements enter or leave the viewport in a performant and browser-optimized way. This method has become the preferred standard over older, less efficient approaches like `getBoundingClientRect()`. To implement this correctly in UNA CMS's Timeline module (v14.0.10), I’ve compiled a list of valuable resources and included a step-by-step guide for applying a patch to improve video display functionality using IntersectionObserver.

### 📚 Consulted Resources:

* **MDN Web Docs – Intersection Observer API**
  [https://developer.mozilla.org/en-US/docs/Web/API/Intersection\_Observer\_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
  Official API documentation, including options, thresholds, usage examples, and best practices.

* **web.dev – IntersectionObserver’s coming into view**
  [https://web.dev/articles/intersectionobserver](https://web.dev/articles/intersectionobserver)
  Google’s recommendations for implementing IntersectionObserver efficiently for viewport detection.

* **Stack Overflow – How can I tell if a DOM element is visible in the current viewport?**
  [https://stackoverflow.com/questions/123999/how-can-i-tell-if-a-dom-element-is-visible-in-the-current-viewport](https://stackoverflow.com/questions/123999/how-can-i-tell-if-a-dom-element-is-visible-in-the-current-viewport)
  A community discussion exploring various techniques, including `getBoundingClientRect()`.

* **Medium – Is an element visible in the viewport? (Marco Prontera)**
  [https://marco-prontera.medium.com/now-you-see-me-is-in-viewport-javascript-efa19b20b063](https://marco-prontera.medium.com/now-you-see-me-is-in-viewport-javascript-efa19b20b063)
  Tutorial comparing native JavaScript solutions with IntersectionObserver.

* **30 Seconds of Code – Check if an element is visible in the viewport**
  [https://www.30secondsofcode.org/js/s/element-is-visible-in-viewport](https://www.30secondsofcode.org/js/s/element-is-visible-in-viewport)
  A simple, efficient snippet for viewport detection using `getBoundingClientRect()`.

* **Uploadcare Blog – A guide to Intersection Observer**
  [https://uploadcare.com/blog/intersection-observer-guide/](https://uploadcare.com/blog/intersection-observer-guide/)
  A practical, illustrated guide to using IntersectionObserver for scroll-based events.

* **GoogleChromeLabs / intersection-observer Polyfill**
  [https://github.com/GoogleChromeLabs/intersection-observer](https://github.com/GoogleChromeLabs/intersection-observer)
  Official polyfill for ensuring IntersectionObserver support in legacy browsers like IE11.

* **W3C Intersection Observer Specification (GitHub mirror)**
  [https://github.com/w3c/IntersectionObserver](https://github.com/w3c/IntersectionObserver)
  The formal specification for IntersectionObserver.

* **UNA CMS – Timeline Module Documentation**
  [https://unacms.com/wiki/Timeline](https://unacms.com/wiki/Timeline)
  Official UNA Wiki for the Timeline module, including details about video embedding and display.

* **Verge.js (GitHub) – viewport utility functions**
  [https://github.com/ryanve/verge](https://github.com/ryanve/verge)
  A lightweight JavaScript library for viewport presence and dimension detection.

* **Reddit – Detecting what elements are currently in a viewport**
  [https://www.reddit.com/r/learnjavascript/comments/txfr6r/how\_can\_i\_detect\_what\_elements\_are\_currently\_in\_a/](https://www.reddit.com/r/learnjavascript/comments/txfr6r/how_can_i_detect_what_elements_are_currently_in_a/)
  A community thread discussing different modern JavaScript viewport detection methods.

## 📦 Patch Installation Guide for UNA CMS Timeline 14.0.10

### Steps:

1. **Navigate to the UNA Directory**
   Use the terminal to move into your UNA installation directory:

   ```bash
   cd una
   ```

2. **Remove the Existing File**
   Delete the old JavaScript file:

   ```bash
   rm modules/boonex/timeline/js/view.js
   ```

3. **Download and Apply the Patched File**
   Fetch the patched file from my repository and overwrite the old one:

   ```bash
   curl -o modules/boonex/timeline/js/view.js https://raw.githubusercontent.com/kabballa/timeline/14.0.10/js/view.js
   ```

4. **Set Correct File Permissions**
   Set permissions to allow the owner to read and write, and others to read:

   ```bash
   chmod 644 modules/boonex/timeline/js/view.js
   ```

   **Permissions breakdown:**

   * Owner: read & write
   * Group: read
   * Others: read

5. **Set Correct File Ownership**
   Ensure the file is owned by the correct web server user (replace `www-data` with your actual web user if different):

   ```bash
   chown www-data:www-data modules/boonex/timeline/js/view.js
   ```

   You can verify the current ownership of nearby files using:

   ```bash
   ls -l modules/boonex/timeline/js/
   ```

6. **Verify the Changes**
   Confirm permissions and ownership:

   ```bash
   ls -l modules/boonex/timeline/js/view.js
   ```

   Example output:

   ```
   -rw-r--r-- 1 www-data www-data 12345 May  7 23:00 modules/boonex/timeline/js/view.js
   ```

7. **Clear All Caches**
   Clear UNA’s system and JS caches to apply changes immediately.


## ⚠️ Note:

This patch is a temporary solution for **Timeline module v14.0.10** and only affects **videos uploaded via the UNA Video module**. Future UNA updates might overwrite this modification. I encourage the UNA team to review, refine, and integrate this improvement into upcoming releases.

If you wish to revert to the original file:

1. **Remove the Patched File**

   ```bash
   rm modules/boonex/timeline/js/view.js
   ```

2. **Restore the Original UNA Version**

   ```bash
   curl -o modules/boonex/timeline/js/view.js https://raw.githubusercontent.com/unacms/una/refs/tags/14.0.0/modules/boonex/timeline/js/view.js
   ```

3. **Reset Permissions and Ownership**

   ```bash
   chmod 644 modules/boonex/timeline/js/view.js
   chown www-data:www-data modules/boonex/timeline/js/view.js
   ```

4. **Clear All Caches Again**