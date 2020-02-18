# Changelog for Monitorado

1.4.0
=====
* TypeScript types are now exported with the library.

1.3.3
=====
* Updated dependencies.

1.3.2
=====
* Cleanup successful logs are now logged as debug (as info before).
* Default cleanup interval reduced from 20 to every 10 minutes.
* Updated dependencies.

1.3.1
=====
* Updated dependencies.

1.3.0
=====
* Output data now also shows "current" (the last data value).
* Updated dependencies.

1.2.3
=====
* Fixed output that was including unfinished metrics in the calculations.
* Updated dependencies.

1.2.2
=====
* Properly handle options on output (arrays ie. intervals were being merged).
* Improved error logging.
* Updated dependencies.

1.2.1
=====
* Improved metrics persistence logging.

1.2.0
=====
* NEW! You can now persist metrics to JSON files.
* Added some basic settings validation to avoid unexpected behaviour.

1.1.3
=====
* Fixed success rate calculation in output (was always 100).

1.1.2
=====
* Consider options as tag if passed as string on metrics.start().
* Tags must now be string, number, boolean or date.

1.1.1
=====
* Force load default settings on init.
* Fixed package dependencies.

1.1.0
=====
* NEW! Success rate (errored vs. total calls) on output.
* Calls anyhow.setup() on load, if anyhow is not ready yet.
* Updated dependencies.

1.0.1
=====
* Updated dependencies.

1.0.0
=====
* Initial release.
