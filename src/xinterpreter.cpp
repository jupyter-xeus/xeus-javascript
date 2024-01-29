/***************************************************************************
* Copyright (c) 2024, Thorsten Beier
*
* Distributed under the terms of the BSD 3-Clause License.
*
* The full license is in the file LICENSE, distributed with this software.
****************************************************************************/

#include <string>
#include <vector>
#include <iostream>

#include "nlohmann/json.hpp"

#include "xeus/xinput.hpp"
#include "xeus/xinterpreter.hpp"
#include "xeus/xhelper.hpp"
#include "xeus-javascript/xinterpreter.hpp"

// embind
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>

#include <sstream>

namespace nl = nlohmann;
namespace xeus_javascript
{

    void publish_stdout_stream(const std::string& message)
    {
        // get interpreter
        auto & interpreter = xeus::get_interpreter();
        // publish stream
        interpreter.publish_stream("stdout", message);
    }

    void publish_stderr_stream(const std::string& message)
    {
        // get interpreter
        auto & interpreter = xeus::get_interpreter();
        // publish stream
        interpreter.publish_stream("stderr", message);
    }

    void display_data(const std::string& json_str)
    {
        // get interpreter
        auto & interpreter = xeus::get_interpreter();

        auto data = nl::json::parse(json_str);

        // publish stream
        interpreter.display_data(
            data["data"],
            data["metadata"],
            data["transient"]
        );
    }

    interpreter::interpreter()
    {
        std::cout<<"142th iteration of this file kernel (due to the service worker caching I need to print this to keep sanity)"<<std::endl;
        xeus::register_interpreter(this);
    }

    nl::json interpreter::execute_request_impl(int execution_counter, // Typically the cell number
                                                      const  std::string & code, // Code to execute
                                                      bool silent,
                                                      bool /*store_history*/,
                                                      nl::json /*user_expressions*/,
                                                      bool /*allow_stdin*/)
    {
        nl::json kernel_res;



        auto result_promise = emscripten::val::module_property("_call_user_code")(code);
        auto result = result_promise.await();
        if(result["has_error"].as<bool>()) {

            const auto error_type = result["error_type"].as<std::string>();
            const auto error_message = result["error_message"].as<std::string>();
            const auto error_stack = result["error_stack"].as<std::string>();

            kernel_res["status"] = "error";
            kernel_res["ename"] = error_type;
            kernel_res["evalue"] = error_message;
            kernel_res["traceback"] = {error_stack};
            if(!silent){
                publish_execution_error(error_type, error_message, {error_stack});
            }
            return kernel_res;
        }

        if (!silent )
        {
            nl::json pub_data;
            publish_execution_result(execution_counter, std::move(pub_data), nl::json::object());
        }



        return xeus::create_successful_reply(nl::json::array(), nl::json::object());
    }

    void interpreter::configure_impl()
    {
        emscripten::val::module_property("_configure")();
    }

    nl::json interpreter::is_complete_request_impl(const std::string& code)
    {
        // Insert code here to validate the ``code``
        // and use `create_is_complete_reply` with the corresponding status
        // "unknown", "incomplete", "invalid", "complete"
        return xeus::create_is_complete_reply("complete"/*status*/, "   "/*indent*/);
    }

    nl::json interpreter::complete_request_impl(const std::string&  code,
                                                     int cursor_pos)
    {

        auto result_json_str_js = emscripten::val::module_property("_complete_request")(code, cursor_pos);
        auto result_json_str = result_json_str_js.as<std::string>();

        if(result_json_str.empty()) {
            return xeus::create_complete_reply(
                nl::json::array(),  /*matches*/
                cursor_pos,         /*cursor_start*/
                cursor_pos          /*cursor_end*/
            );
        }

        auto result_json = nl::json::parse(result_json_str);
        auto matches = result_json["matches"];
        auto cursor_start = result_json["cursor_start"];
        auto cursor_end = result_json["cursor_end"];
        auto status = result_json["status"];

        return xeus::create_complete_reply(
            matches,
            cursor_start,
            cursor_end
        );
    }

    nl::json interpreter::inspect_request_impl(const std::string& /*code*/,
                                                      int /*cursor_pos*/,
                                                      int /*detail_level*/)
    {
        return xeus::create_inspect_reply(false/*found*/,
            {{std::string("text/plain"), std::string("hello!")}}, /*data*/
            {{std::string("text/plain"), std::string("hello!")}}  /*meta-data*/
        );

    }
    void interpreter::shutdown_request_impl() {
        //std::cout << "Bye!!" << std::endl;
    }


    nl::json interpreter::kernel_info_request_impl()
    {

        const std::string  protocol_version = "5.3";
        const std::string  implementation = "xjavascript";
        const std::string  implementation_version = XEUS_JAVASCRIPT_VERSION;
        const std::string  language_name = "javascript";
        const std::string  language_version = "ES6";
        const std::string  language_mimetype = "text/x-javascript";;
        const std::string  language_file_extension = "js";;
        const std::string  language_pygments_lexer = "";
        const std::string  language_codemirror_mode = "";
        const std::string  language_nbconvert_exporter = "";
        const std::string  banner = "xjavascript";
        const bool         debugger = false;

        const nl::json     help_links = nl::json::array();


        return xeus::create_info_reply(
            protocol_version,
            implementation,
            implementation_version,
            language_name,
            language_version,
            language_mimetype,
            language_file_extension,
            language_pygments_lexer,
            language_codemirror_mode,
            language_nbconvert_exporter,
            banner,
            debugger,
            help_links
        );
    }

}
