/***************************************************************************
* Copyright (c) 2024, Thorsten Beier
*
* Distributed under the terms of the BSD 3-Clause License.
*
* The full license is in the file LICENSE, distributed with this software.
****************************************************************************/


#ifndef XEUS_JAVASCRIPT_INTERPRETER_HPP
#define XEUS_JAVASCRIPT_INTERPRETER_HPP

#ifdef __GNUC__
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wattributes"
#endif

#include <string>
#include <memory>

#include "nlohmann/json.hpp"

#include "xeus_javascript_config.hpp"
#include "xeus/xinterpreter.hpp"


namespace nl = nlohmann;

namespace xeus_javascript
{


    struct XEUS_JAVASCRIPT_API send_reply_callback_wrapper
    {
        xeus::xinterpreter::send_reply_callback callback;
        void call(const nl::json& reply) const;

        void reply_success() const;
        void reply_error(const std::string& error_type, const std::string& error_message, const std::string & error_stack) const;
    };

    class XEUS_JAVASCRIPT_API interpreter : public xeus::xinterpreter
    {
    public:

        interpreter();
        virtual ~interpreter() = default;

        inline std::string name()const
        {
            return "xjavascript";
        }
        void js_publish_execution_error(const std::string& error_type, const std::string& error_message, const std::string & error_stack);

    protected:

        void configure_impl() override;

        void execute_request_impl(send_reply_callback cb,
                             int execution_counter,
                             const std::string& code,
                             xeus::execute_request_config config,
                             nl::json user_expressions) override;

        nl::json complete_request_impl(const std::string& code, int cursor_pos) override;

        nl::json inspect_request_impl(const std::string& code,
                                      int cursor_pos,
                                      int detail_level) override;

        nl::json is_complete_request_impl(const std::string& code) override;

        nl::json kernel_info_request_impl() override;

        void shutdown_request_impl() override;


    };

    void export_xinterpreter();

}

#ifdef __GNUC__
    #pragma GCC diagnostic pop
#endif

#endif
