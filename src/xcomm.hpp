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
#include "xeus-javascript/convert.hpp"
// embind
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>

#include <sstream>

namespace nl = nlohmann;
namespace em = emscripten;


namespace xeus_javascript
{

    class xcomm
    {
    public:

        using js_callback_type = em::val;
        using cpp_callback_type = std::function<void(const xeus::xmessage&)>;
        using buffers_sequence = xeus::buffer_sequence;

        xcomm(
            std::string target_name,
            nl::json extra_kwargs
        );
        xcomm(xeus::xcomm&& comm);
        xcomm(xcomm&& comm) = default;
        virtual ~xcomm();

        std::string comm_id() const;
        bool kernel() const;

        void open(const nl::json& data, const nl::json& metadata, const em::val& buffers);
        void close(const nl::json& data, const nl::json& metadata, const em::val& buffers);
        void send(const nl::json& data, const nl::json& metadata, const em::val& buffers);
        void on_msg(const js_callback_type& callback);
        void on_close(const js_callback_type& callback);
    
        static std::unique_ptr<MyClass> create(std::string target_name, nl::json extra_kwargs);


    private:

        xeus::xtarget* target(const std::string & target_name) const;
        xeus::xguid id(const nl::json & kwargs) const;
        cpp_callback_type cpp_callback(const js_callback_type& callback) const;

        xeus::xcomm m_comm;
    };
    struct xcomm_manager
    {
        xcomm_manager() = default;

        void register_target(const std::string & target_name, const em::val& callback);
    };

    void export_xcomm();


} // namespace xeus_javascript
