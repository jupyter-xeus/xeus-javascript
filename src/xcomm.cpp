/***************************************************************************
* Copyright (c) 2024, Thorsten Beier
*
* Distributed under the terms of the BSD 3-Clause License.
*
* The full license is in the file LICENSE, distributed with this software.
****************************************************************************/

#include "xcomm.hpp"

#include <xeus/xembind.hpp>

#include <emscripten/bind.h>
#include <xeus-javascript/convert.hpp>

namespace nl = nlohmann;
namespace em = emscripten;

namespace xeus_javascript
{

    xeus::buffer_sequence jslist_to_cpp_buffers(const em::val& buffers)
    {
        xeus::buffer_sequence res;
        xeus::buffer_sequence_from_js_buffer(res, buffers);
        return res;
    }


    xcomm::xcomm(
        std::string target_name,
        nl::json data,
        nl::json metadata,
        em::val buffers,
        nl::json kwargs
    )
        : m_comm(target(target_name), id(kwargs))
    {
        m_comm.open(metadata, data, jslist_to_cpp_buffers(buffers));
    }

    xcomm::xcomm(xeus::xcomm&& comm)
        : m_comm(std::move(comm))
    {
    }

    xcomm::~xcomm()
    {
    }

    std::string xcomm::comm_id() const
    {
        return m_comm.id();
    }

    bool xcomm::kernel() const
    {
        return true;
    }

    void xcomm::close(const nl::json & data, const nl::json& metadata, const em::val & buffers)
    {
        m_comm.close(metadata, data, jslist_to_cpp_buffers(buffers));
    }

    void xcomm::send(const nl::json & data, const nl::json& metadata, const em::val & buffers)
    {
        m_comm.send(metadata, data, jslist_to_cpp_buffers(buffers));
    }

    void xcomm::on_msg(const js_callback_type& callback)
    {
        m_comm.on_message(cpp_callback(callback));
    }

    void xcomm::on_close(const js_callback_type& callback)
    {
        m_comm.on_close(cpp_callback(callback));
    }

    xeus::xtarget* xcomm::target(const std::string & target_name) const
    {
        return xeus::get_interpreter().comm_manager().target(target_name);
    }

    xeus::xguid xcomm::id(const nl::json & kwargs) const
    {

        if (auto iter = kwargs.find("comm_id"); iter != kwargs.end())
        {
            const std::string comm_id = iter->get<std::string>();
            return xeus::xguid(comm_id);
        }
        else
        {
            return xeus::new_xguid();
        }
    }

    auto xcomm::cpp_callback(const js_callback_type& js_callback) const -> cpp_callback_type
    {
        return [this, js_callback](const xeus::xmessage& msg)
        {
            js_callback(xeus::js_message_from_xmessage(msg, /*copy*/ true));
        };
    }

    void xcomm_manager::register_target(const std::string& target_name, const em::val& callback)
    {
        auto target_callback = [callback] (xeus::xcomm&& comm, const xeus::xmessage& msg)
        {
            callback(xcomm(std::move(comm)), xeus::js_message_from_xmessage(msg, /*copy*/ true));
        };

        xeus::get_interpreter().comm_manager().register_comm_target(
            static_cast<std::string>(target_name), target_callback
        );
    }


    void export_xcomm(){
        em::class_<xcomm>("Comm")
            .constructor<std::string, nl::json, nl::json, em::val, nl::json>()
            .function("comm_id", &xcomm::comm_id)
            .function("kernel", &xcomm::kernel)
            .function("close", &xcomm::close)
            .function("send", &xcomm::send)
            .function("on_msg", &xcomm::on_msg)
            .function("on_close", &xcomm::on_close)
            .function("comm_id", &xcomm::comm_id)
            .function("kernel", &xcomm::kernel)
            ;

        em::class_<xcomm_manager>("CommManager")
            .constructor<>()
            .function("register_target", &xcomm_manager::register_target)
            ;

    }


} // namespace xeus_javascript
