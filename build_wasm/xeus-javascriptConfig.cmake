############################################################################
# Copyright (c) 2024, Thorsten Beier          
#                                                     
#                                                                          
# Distributed under the terms of the BSD 3-Clause License.               
#                                                                          
# The full license is in the file LICENSE, distributed with this software. 
############################################################################

# xeus-javascript cmake module
# This module sets the following variables in your project::
#
#   xeus-javascript_FOUND - true if xeus-javascript was found on the system
#   xeus-javascript_INCLUDE_DIRS - the directory containing xeus-javascript headers
#   xeus-javascript_LIBRARY - the library for dynamic linking
#   xeus-javascript_STATIC_LIBRARY - the library for static linking


####### Expanded from @PACKAGE_INIT@ by configure_package_config_file() #######
####### Any changes to this file will be overwritten by the next CMake run ####
####### The input file was xeus-javascriptConfig.cmake.in                            ########

get_filename_component(PACKAGE_PREFIX_DIR "${CMAKE_CURRENT_LIST_DIR}/../../../micromamba/envs/xeus-wasm-dev" ABSOLUTE)

macro(set_and_check _var _file)
  set(${_var} "${_file}")
  if(NOT EXISTS "${_file}")
    message(FATAL_ERROR "File or directory ${_file} referenced by variable ${_var} does not exist !")
  endif()
endmacro()

macro(check_required_components _NAME)
  foreach(comp ${${_NAME}_FIND_COMPONENTS})
    if(NOT ${_NAME}_${comp}_FOUND)
      if(${_NAME}_FIND_REQUIRED_${comp})
        set(${_NAME}_FOUND FALSE)
      endif()
    endif()
  endforeach()
endmacro()

####################################################################################

set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR};${CMAKE_MODULE_PATH}")

####### Expanded from @XEUS_JAVASCRIPT_CONFIG_CODE@ #######
set(CMAKE_MODULE_PATH "/Users/thorstenbeier/src/xeus-javascript/cmake;${CMAKE_MODULE_PATH}")
##################################################

include(CMakeFindDependencyMacro)
find_dependency(xtl 0.7.0)
find_dependency(xeus-zmq )
find_dependency(cppzmq )


if (NOT TARGET xeus-javascript AND NOT TARGET xeus-javascript-static)
    include("${CMAKE_CURRENT_LIST_DIR}/xeus-javascriptTargets.cmake")

    if (TARGET xeus-javascript AND TARGET xeus-javascript-static)
        get_target_property(xeus-javascript_INCLUDE_DIR xeus-javascript INTERFACE_INCLUDE_DIRECTORIES)
        get_target_property(xeus-javascript_LIBRARY xeus-javascript LOCATION)
        get_target_property(xeus-javascript_STATIC_LIBRARY xeus-javascript-static LOCATION)
    elseif (TARGET xeus-javascript)
        get_target_property(xeus-javascript_INCLUDE_DIR xeus-javascript INTERFACE_INCLUDE_DIRECTORIES)
        get_target_property(xeus-javascript_LIBRARY xeus-javascript LOCATION)
    elseif (TARGET xeus-javascript-static)
        get_target_property(xeus-javascript_INCLUDE_DIR xeus-javascript-static INTERFACE_INCLUDE_DIRECTORIES)
        get_target_property(xeus-javascript_STATIC_LIBRARY xeus-javascript-static LOCATION)
        set(xeus-javascript_LIBRARY ${xeus-javascript_STATIC_LIBRARY})
    endif ()
endif ()
