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


    void send_reply_callback_wrapper::call(const nl::json& reply)  const{
        callback(reply);
    }

     void send_reply_callback_wrapper::reply_success() const
    {
        callback(
            xeus::create_successful_reply(nl::json::array(), nl::json::object())
        );
    }
    void send_reply_callback_wrapper::reply_error(const std::string& error_type, const std::string& error_message, const std::string & error_stack) const
    {
        callback(
            xeus::create_error_reply(error_type, error_message, {error_stack})
        );
    }

    interpreter::interpreter()
    {
        std::cout<<"build #223"<<std::endl;
        xeus::register_interpreter(this);
    }

    void interpreter::execute_request_impl(send_reply_callback cb,
                                               int execution_counter,
                                               const std::string& code,
                                               xeus::execute_request_config config,
                                               nl::json /*user_expressions*/)
    {
        nl::json kernel_res;

        auto cb_wrapper = send_reply_callback_wrapper{cb};

        emscripten::val::module_property("_call_user_code")(execution_counter, config, cb_wrapper, code);
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

        std::cout<<"found #"<<matches.size()<<std::endl;

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

    void interpreter::js_publish_execution_error(const std::string& error_type, const std::string& error_message, const std::string & error_stack)
    {
        xeus::get_interpreter().publish_execution_error(error_type, error_message, {error_stack});
    }

    void export_xinterpreter()
    {




        em::class_<xeus::execute_request_config>("execute_request_config")
            .constructor<>()
            .property("silent", &xeus::execute_request_config::silent)
            .property("store_history", &xeus::execute_request_config::store_history)
            .property("allow_stdin", &xeus::execute_request_config::allow_stdin)
        ;

        em::class_<xeus::xinterpreter>("xinterpreter")
            .function("publish_stream", &interpreter::publish_stream)
            .function("display_data", &interpreter::display_data)
            .function("update_display_data", &interpreter::update_display_data)
            .function("publish_execution_result", &interpreter::publish_execution_result)
        ;

        em::class_<send_reply_callback_wrapper>("send_reply_callback_wrapper")
            .function("call", &send_reply_callback_wrapper::call)
            .function("reply_success", &send_reply_callback_wrapper::reply_success)
            .function("reply_error", &send_reply_callback_wrapper::reply_error)
        ;

        em::class_<interpreter, em::base<xeus::xinterpreter>>("Iterpreter")
            .function("publish_execution_error", &interpreter::js_publish_execution_error)
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
