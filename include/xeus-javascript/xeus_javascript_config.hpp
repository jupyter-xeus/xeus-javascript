/***************************************************************************
* Copyright (c) 2024, Thorsten Beier
*
* Distributed under the terms of the BSD 3-Clause License.
*
* The full license is in the file LICENSE, distributed with this software.
****************************************************************************/

#ifndef XEUS_JAVASCRIPT_CONFIG_HPP
#define XEUS_JAVASCRIPT_CONFIG_HPP

// Project version
#define XEUS_JAVASCRIPT_VERSION_MAJOR 0
#define XEUS_JAVASCRIPT_VERSION_MINOR 3
#define XEUS_JAVASCRIPT_VERSION_PATCH 2

// Composing the version string from major, minor and patch
#define XEUS_JAVASCRIPT_CONCATENATE(A, B) XEUS_JAVASCRIPT_CONCATENATE_IMPL(A, B)
#define XEUS_JAVASCRIPT_CONCATENATE_IMPL(A, B) A##B
#define XEUS_JAVASCRIPT_STRINGIFY(a) XEUS_JAVASCRIPT_STRINGIFY_IMPL(a)
#define XEUS_JAVASCRIPT_STRINGIFY_IMPL(a) #a

#define XEUS_JAVASCRIPT_VERSION XEUS_JAVASCRIPT_STRINGIFY(XEUS_JAVASCRIPT_CONCATENATE(XEUS_JAVASCRIPT_VERSION_MAJOR,   \
                 XEUS_JAVASCRIPT_CONCATENATE(.,XEUS_JAVASCRIPT_CONCATENATE(XEUS_JAVASCRIPT_VERSION_MINOR,   \
                                  XEUS_JAVASCRIPT_CONCATENATE(.,XEUS_JAVASCRIPT_VERSION_PATCH)))))

#ifdef _WIN32
    #ifdef XEUS_JAVASCRIPT_EXPORTS
        #define XEUS_JAVASCRIPT_API __declspec(dllexport)
    #else
        #define XEUS_JAVASCRIPT_API __declspec(dllimport)
    #endif
#else
    #define XEUS_JAVASCRIPT_API
#endif

#endif
