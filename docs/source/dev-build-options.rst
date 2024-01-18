..  Copyright (c) 2024,    

   Distributed under the terms of the BSD 3-Clause License.  

   The full license is in the file LICENSE, distributed with this software.

Build and configuration
=======================

General Build Options
---------------------

Building the xeus-javascript library
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``xeus-javascript`` build supports the following options:

- ``XEUS_JAVASCRIPT_BUILD_SHARED``: Build the ``xeus-javascript`` shared library. **Enabled by default**.
- ``XEUS_JAVASCRIPT_BUILD_STATIC``: Build the ``xeus-javascript`` static library. **Enabled by default**.


- ``XEUS_JAVASCRIPT_USE_SHARED_XEUS``: Link with a `xeus` shared library (instead of the static library). **Enabled by default**.

Building the kernel
~~~~~~~~~~~~~~~~~~~

The package includes two options for producing a kernel: an executable ``xjavascript`` and a Python extension module, which is used to launch a kernel from Python.

- ``XEUS_JAVASCRIPT_BUILD_EXECUTABLE``: Build the ``xjavascript``  executable. **Enabled by default**.


If ``XEUS_JAVASCRIPT_USE_SHARED_XEUS_JAVASCRIPT`` is disabled, xjavascript  will be linked statically with ``xeus-javascript``.

Building the Tests
~~~~~~~~~~~~~~~~~~

- ``XEUS_JAVASCRIPT_BUILD_TESTS ``: enables the tets  **Disabled by default**.

