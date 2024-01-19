/***************************************************************************
* Copyright (c) 2024, Thorsten Beier                                  
*                                                                          
* Distributed under the terms of the BSD 3-Clause License.                 
*                                                                          
* The full license is in the file LICENSE, distributed with this software. 
****************************************************************************/

#include <iostream>
#include <memory>


#include <emscripten/bind.h>

#include "xeus-javascript/xinterpreter.hpp"
#include "xeus/xembind.hpp"


EMSCRIPTEN_BINDINGS(my_module) {
    xeus::export_core();
    using interpreter_type = xeus_javascript::interpreter;
    xeus::export_kernel<interpreter_type>("xkernel");


    emscripten::function("_publish_stdout_stream", &xeus_javascript::publish_stdout_stream);
    emscripten::function("_publish_stderr_stream", &xeus_javascript::publish_stderr_stream);
    emscripten::function("_display_data", &xeus_javascript::display_data);

}

