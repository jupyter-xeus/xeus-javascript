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


void _stdout(const std::string& msg)
{
    std::cout << msg << std::endl;
}

EMSCRIPTEN_BINDINGS(my_module) {
    xeus::export_core();
    using interpreter_type = xeus_javascript::interpreter;
    xeus::export_kernel<interpreter_type>("xkernel");



    emscripten::function("_publish_stdout_stream", &xeus_javascript::publish_stdout_stream);
    emscripten::function("_publish_stderr_stream", &xeus_javascript::publish_stderr_stream);
    emscripten::function("_display_data", &xeus_javascript::display_data);

    // we overwrite the console.log function, so that we can redirect the output
    // to the kernel. But sometime we need to call the original console.log without
    // redirection.
    // Since all std::cout calls are redirected to console.log, we just expose
    // some api to stdout
    emscripten::function("_stdout", &_stdout);


}
