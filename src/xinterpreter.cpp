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
#include <xeus-javascript/convert.hpp>
#include <sstream>

#include <xeus-javascript/convert.hpp>

namespace nl = nlohmann;
namespace em = emscripten;

namespace xeus_javascript
{
    interpreter::interpreter()
    {
        std::cout<<"build number 195"<<std::endl;
        xeus::register_interpreter(this);
    }

    void interpreter::execute_request_impl(xeus::xrequest_context request_context,
                                               send_reply_callback cb,
                                               int execution_counter,
                                               const std::string& code,
                                               xeus::execute_request_config config,
                                               nl::json user_expressions)
    {
        nl::json kernel_res;


        auto result_promise = emscripten::val::module_property("_call_user_code")(code);
        const nl::json result_json = result_promise.await().as<nl::json>();
        const bool has_error = result_json["has_error"].get<bool>();

        if(has_error) {

            const auto error_type = result_json["error_type"].get<std::string>();
            const auto error_message = result_json["error_message"].get<std::string>();
            const auto error_stack = result_json["error_stack"].get<std::string>();

            kernel_res["status"] = "error";
            kernel_res["ename"] = error_type;
            kernel_res["evalue"] = error_message;
            kernel_res["traceback"] = {error_stack};
            if(!config.silent){
                publish_execution_error(request_context, error_type, error_message, {error_stack});
            }
            cb(kernel_res);
            return;
        }

        if (!config.silent)
        {
            const bool with_result = result_json["with_result"].get<bool>();
            nl::json pub_data = result_json["pub_data"];
            publish_execution_result(request_context, execution_counter, std::move(pub_data), nl::json::object());
        }



        cb(xeus::create_successful_reply(nl::json::array(), nl::json::object()));
    }

    void interpreter::configure_impl()
    {
        emscripten::val::module_property("_configure")();
    }

    nl::json interpreter::is_complete_request_impl(const std::string& /*cod*/)
    {
        // Insert code here to validate the ``code``
        // and use `create_is_complete_reply` with the corresponding status
        // "unknown", "incomplete", "invalid", "complete"
        return xeus::create_is_complete_reply("complete"/*status*/, "   "/*indent*/);
    }

    nl::json interpreter::complete_request_impl(const std::string&  code,
                                                     int cursor_pos)
    {
        const nl::json result_json = emscripten::val::module_property("_complete_request")(code, cursor_pos).as<nl::json>();
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

    void export_xinterpreter()
    {

        em::class_<xeus::xinterpreter>("xinterpreter")
            .function("publish_stream", &interpreter::publish_stream)
            .function("display_data", &interpreter::display_data)
            .function("update_display_data", &interpreter::update_display_data)
            .function("publish_execution_error", &interpreter::publish_execution_error)
            .function("publish_execution_result", &interpreter::publish_execution_result)
        ;

        em::class_<interpreter, em::base<xeus::xinterpreter>>("Sample")
        ;

        // get the interpreter
        em::function("_get_interpreter", em::select_overload<interpreter*()>(
            []() -> interpreter* {
                auto i =  static_cast<interpreter*>(&xeus::get_interpreter());
                return i;
            }
        ), em::allow_raw_pointers());

    }
}
